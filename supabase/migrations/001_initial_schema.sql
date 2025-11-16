-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'ejecutivo', 'operaciones', 'caja', 'colaborador');
CREATE TYPE service_status AS ENUM ('borrador', 'confirmado', 'en_ejecucion', 'finalizado', 'cerrado');
CREATE TYPE service_type AS ENUM ('inhumacion', 'cremacion', 'traslado_nacional', 'traslado_internacional', 'solo_velatorio');
CREATE TYPE transaction_status AS ENUM ('pendiente', 'pagado', 'rechazado', 'reembolsado');
CREATE TYPE payment_method AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'seguro', 'cuota_mortuoria');
CREATE TYPE expense_status AS ENUM ('con_factura', 'pendiente_factura', 'sin_factura');
CREATE TYPE collaborator_type AS ENUM ('empleado', 'honorario');
CREATE TYPE document_type AS ENUM ('certificado_defuncion', 'pase_sepultacion', 'documentos_sml', 'factura_boleta', 'cuota_mortuoria_docs', 'contrato', 'otro');
CREATE TYPE mortuary_quota_status AS ENUM ('no_iniciada', 'en_preparacion', 'ingresada', 'aprobada', 'rechazada', 'pagada');
CREATE TYPE mortuary_quota_entity AS ENUM ('afp', 'ips', 'pgu', 'otra');
CREATE TYPE mortuary_quota_payer AS ENUM ('familia', 'funeraria');

-- Funeral Homes (Organizations)
CREATE TABLE funeral_homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    rut TEXT NOT NULL UNIQUE,
    business_line TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    sanitary_resolution_number TEXT,
    sanitary_resolution_issue_date DATE,
    sanitary_resolution_expiry_date DATE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches (Sucursales)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'colaborador',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Branch assignments (many-to-many)
CREATE TABLE user_branches (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, branch_id)
);

-- Collaborators (Colaboradores)
CREATE TABLE collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    rut TEXT NOT NULL,
    type collaborator_type NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    base_salary DECIMAL(12, 2), -- Only for empleados
    payment_method TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(funeral_home_id, rut)
);

-- Plans (Planes funerarios)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    service_type service_type,
    base_price DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coffins and Urns (Ataúdes y urnas)
CREATE TABLE coffin_urns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ataud', 'urna')),
    commercial_name TEXT NOT NULL,
    sku TEXT,
    material TEXT,
    size TEXT, -- adulto, infantil, especial
    category TEXT, -- economico, estandar, premium
    sale_price DECIMAL(12, 2) NOT NULL,
    cost DECIMAL(12, 2),
    stock_available INTEGER DEFAULT 0,
    supplier_id UUID, -- Will reference suppliers table
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cemeteries and Crematoriums
CREATE TABLE cemetery_crematoriums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cementerio', 'crematorio')),
    address TEXT,
    contact_info TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    license_plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL, -- carroza, van, etc.
    capacity INTEGER,
    status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_mantenimiento')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(funeral_home_id, license_plate)
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rut TEXT,
    business_type TEXT, -- florería, música, catering, etc.
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (Servicios funerarios) - Core entity
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    service_number TEXT NOT NULL, -- Autogenerated ID
    status service_status NOT NULL DEFAULT 'borrador',
    service_type service_type NOT NULL,
    general_notes TEXT,
    
    -- Deceased information
    deceased_name TEXT NOT NULL,
    deceased_rut TEXT,
    deceased_birth_date DATE,
    deceased_death_date TIMESTAMPTZ NOT NULL,
    deceased_death_place_type TEXT CHECK (deceased_death_place_type IN ('domicilio', 'hospital', 'via_publica', 'otro')),
    deceased_death_place TEXT,
    deceased_death_cause TEXT,
    
    -- Responsible person
    responsible_name TEXT NOT NULL,
    responsible_rut TEXT NOT NULL,
    responsible_phone TEXT NOT NULL,
    responsible_email TEXT,
    responsible_address TEXT,
    responsible_relationship TEXT,
    
    -- Plan and products
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    coffin_id UUID REFERENCES coffin_urns(id) ON DELETE SET NULL,
    urn_id UUID REFERENCES coffin_urns(id) ON DELETE SET NULL,
    
    -- Pricing
    total_items DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    total_final DECIMAL(12, 2) DEFAULT 0,
    
    -- Agenda and logistics
    pickup_date TIMESTAMPTZ,
    wake_start_date TIMESTAMPTZ,
    wake_room TEXT,
    religious_ceremony_date TIMESTAMPTZ,
    burial_cremation_date TIMESTAMPTZ,
    cemetery_crematorium_id UUID REFERENCES cemetery_crematoriums(id) ON DELETE SET NULL,
    main_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    other_vehicles TEXT[], -- Array of vehicle IDs
    logistics_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Service Items (Items de venta dentro del servicio)
CREATE TABLE service_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('plan', 'ataud', 'urna', 'extra')),
    category TEXT,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Pagos)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'CLP',
    payment_method payment_method NOT NULL,
    account_destination TEXT, -- Caja, Banco X, etc.
    status transaction_status NOT NULL DEFAULT 'pendiente',
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Expenses (Egresos)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT, -- Can be free text if not in catalog
    concept TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT, -- combustible, insumos, servicios_externos, arriendo, etc.
    tax_info TEXT, -- Percentage or notes
    invoice_number TEXT,
    status expense_status DEFAULT 'sin_factura',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Service Assignments (Colaboradores asignados a servicios)
CREATE TABLE service_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    role_in_service TEXT NOT NULL, -- chofer, tanatopractor, ceremonista, ejecutivo_ventas, etc.
    extra_type TEXT DEFAULT 'monto_fijo', -- For future: porcentaje
    extra_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mortuary Quota (Cuota mortuoria)
CREATE TABLE mortuary_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    applies BOOLEAN DEFAULT false,
    entity mortuary_quota_entity,
    entity_name TEXT, -- AFP name or free text
    invoiced_amount DECIMAL(12, 2),
    payer mortuary_quota_payer,
    status mortuary_quota_status DEFAULT 'no_iniciada',
    request_date DATE,
    resolution_date DATE,
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (Archivos adjuntos)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    mortuary_quota_id UUID REFERENCES mortuary_quotas(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Procedures Checklist (Trámites)
CREATE TABLE service_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    procedure_type TEXT NOT NULL, -- certificado_defuncion, pase_sepultacion, documentos_sml, factura_boleta, cuota_mortuoria_prep
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completo')),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL, -- service, transaction, expense, etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- created, updated, deleted, etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_branches_funeral_home ON branches(funeral_home_id);
CREATE INDEX idx_profiles_funeral_home ON profiles(funeral_home_id);
CREATE INDEX idx_user_branches_user ON user_branches(user_id);
CREATE INDEX idx_user_branches_branch ON user_branches(branch_id);
CREATE INDEX idx_collaborators_funeral_home ON collaborators(funeral_home_id);
CREATE INDEX idx_collaborators_branch ON collaborators(branch_id);
CREATE INDEX idx_services_funeral_home ON services(funeral_home_id);
CREATE INDEX idx_services_branch ON services(branch_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_dates ON services(burial_cremation_date, wake_start_date);
CREATE INDEX idx_service_items_service ON service_items(service_id);
CREATE INDEX idx_transactions_service ON transactions(service_id);
CREATE INDEX idx_transactions_funeral_home ON transactions(funeral_home_id);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_expenses_funeral_home ON expenses(funeral_home_id);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);
CREATE INDEX idx_expenses_service ON expenses(service_id);
CREATE INDEX idx_service_assignments_service ON service_assignments(service_id);
CREATE INDEX idx_service_assignments_collaborator ON service_assignments(collaborator_id);
CREATE INDEX idx_mortuary_quotas_service ON mortuary_quotas(service_id);
CREATE INDEX idx_documents_service ON documents(service_id);
CREATE INDEX idx_activity_logs_funeral_home ON activity_logs(funeral_home_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Full text search indexes
CREATE INDEX idx_services_deceased_name_trgm ON services USING gin(deceased_name gin_trgm_ops);
CREATE INDEX idx_services_responsible_name_trgm ON services USING gin(responsible_name gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_funeral_homes_updated_at BEFORE UPDATE ON funeral_homes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffin_urns_updated_at BEFORE UPDATE ON coffin_urns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_assignments_updated_at BEFORE UPDATE ON service_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mortuary_quotas_updated_at BEFORE UPDATE ON mortuary_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate service number
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'SRV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM services WHERE service_number = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate service number
CREATE OR REPLACE FUNCTION set_service_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.service_number IS NULL OR NEW.service_number = '' THEN
        NEW.service_number := generate_service_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_number_trigger BEFORE INSERT ON services FOR EACH ROW EXECUTE FUNCTION set_service_number();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM transactions WHERE transaction_number = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate transaction number
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
        NEW.transaction_number := generate_transaction_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_number_trigger BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION set_transaction_number();

