-- Migration: Add payroll module tables
-- Payroll periods, records, and payment receipts

-- Enum for payroll period status
CREATE TYPE payroll_period_status AS ENUM ('abierto', 'cerrado', 'procesado', 'pagado');

-- Enum for payment receipt status
CREATE TYPE payment_receipt_status AS ENUM ('pendiente', 'generado', 'enviado', 'pagado');

-- Payroll Periods (Periodos de Nomina)
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL, -- e.g., "Noviembre 2024"
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado payroll_period_status NOT NULL DEFAULT 'abierto',
    notas TEXT,
    total_bruto DECIMAL(12, 2) DEFAULT 0,
    total_deducciones DECIMAL(12, 2) DEFAULT 0,
    total_neto DECIMAL(12, 2) DEFAULT 0,
    cantidad_colaboradores INTEGER DEFAULT 0,
    fecha_cierre TIMESTAMPTZ,
    cerrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (fecha_fin >= fecha_inicio)
);

-- Payroll Records (Registros de Nomina por Colaborador)
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,

    -- Base calculation
    sueldo_base DECIMAL(12, 2) DEFAULT 0,
    dias_trabajados INTEGER DEFAULT 0,

    -- Extras from service assignments
    cantidad_servicios INTEGER DEFAULT 0,
    total_extras DECIMAL(12, 2) DEFAULT 0,

    -- Additional components
    bonos DECIMAL(12, 2) DEFAULT 0,
    comisiones DECIMAL(12, 2) DEFAULT 0,

    -- Deductions
    descuentos DECIMAL(12, 2) DEFAULT 0,
    adelantos DECIMAL(12, 2) DEFAULT 0,

    -- Totals
    total_bruto DECIMAL(12, 2) DEFAULT 0,
    total_deducciones DECIMAL(12, 2) DEFAULT 0,
    total_neto DECIMAL(12, 2) DEFAULT 0,

    -- Status
    aprobado BOOLEAN DEFAULT false,
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,

    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One record per collaborator per period
    UNIQUE(payroll_period_id, collaborator_id)
);

-- Payment Receipts (Recibos de Pago)
CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    funeral_home_id UUID NOT NULL REFERENCES funeral_homes(id) ON DELETE CASCADE,

    numero_recibo TEXT NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Receipt details (snapshot at generation time)
    colaborador_nombre TEXT NOT NULL,
    colaborador_rut TEXT NOT NULL,
    periodo_nombre TEXT NOT NULL,

    -- Financial breakdown
    sueldo_base DECIMAL(12, 2) DEFAULT 0,
    extras DECIMAL(12, 2) DEFAULT 0,
    bonos DECIMAL(12, 2) DEFAULT 0,
    comisiones DECIMAL(12, 2) DEFAULT 0,
    total_bruto DECIMAL(12, 2) DEFAULT 0,
    descuentos DECIMAL(12, 2) DEFAULT 0,
    adelantos DECIMAL(12, 2) DEFAULT 0,
    total_deducciones DECIMAL(12, 2) DEFAULT 0,
    total_neto DECIMAL(12, 2) DEFAULT 0,

    -- Status and delivery
    estado payment_receipt_status DEFAULT 'pendiente',
    metodo_pago TEXT,
    fecha_pago DATE,

    -- Digital signature / verification
    codigo_verificacion TEXT,

    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payroll_periods_funeral_home ON payroll_periods(funeral_home_id);
CREATE INDEX idx_payroll_periods_estado ON payroll_periods(estado);
CREATE INDEX idx_payroll_periods_fechas ON payroll_periods(fecha_inicio, fecha_fin);

CREATE INDEX idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX idx_payroll_records_collaborator ON payroll_records(collaborator_id);
CREATE INDEX idx_payroll_records_funeral_home ON payroll_records(funeral_home_id);
CREATE INDEX idx_payroll_records_aprobado ON payroll_records(aprobado);

CREATE INDEX idx_payment_receipts_record ON payment_receipts(payroll_record_id);
CREATE INDEX idx_payment_receipts_funeral_home ON payment_receipts(funeral_home_id);
CREATE INDEX idx_payment_receipts_estado ON payment_receipts(estado);
CREATE INDEX idx_payment_receipts_numero ON payment_receipts(numero_recibo);

-- Triggers for updated_at
CREATE TRIGGER update_payroll_periods_updated_at
    BEFORE UPDATE ON payroll_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_receipts_updated_at
    BEFORE UPDATE ON payment_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM payment_receipts WHERE numero_recibo = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_recibo IS NULL OR NEW.numero_recibo = '' THEN
        NEW.numero_recibo := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number_trigger
    BEFORE INSERT ON payment_receipts
    FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

-- Function to calculate payroll record totals
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate gross total
    NEW.total_bruto := COALESCE(NEW.sueldo_base, 0) +
                       COALESCE(NEW.total_extras, 0) +
                       COALESCE(NEW.bonos, 0) +
                       COALESCE(NEW.comisiones, 0);

    -- Calculate total deductions
    NEW.total_deducciones := COALESCE(NEW.descuentos, 0) +
                             COALESCE(NEW.adelantos, 0);

    -- Calculate net total
    NEW.total_neto := NEW.total_bruto - NEW.total_deducciones;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_payroll_totals_trigger
    BEFORE INSERT OR UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION calculate_payroll_totals();

-- Function to update period totals when records change
CREATE OR REPLACE FUNCTION update_period_totals()
RETURNS TRIGGER AS $$
DECLARE
    period_id UUID;
BEGIN
    -- Determine which period to update
    IF TG_OP = 'DELETE' THEN
        period_id := OLD.payroll_period_id;
    ELSE
        period_id := NEW.payroll_period_id;
    END IF;

    -- Recalculate period totals
    UPDATE payroll_periods
    SET
        total_bruto = (
            SELECT COALESCE(SUM(total_bruto), 0)
            FROM payroll_records
            WHERE payroll_period_id = period_id
        ),
        total_deducciones = (
            SELECT COALESCE(SUM(total_deducciones), 0)
            FROM payroll_records
            WHERE payroll_period_id = period_id
        ),
        total_neto = (
            SELECT COALESCE(SUM(total_neto), 0)
            FROM payroll_records
            WHERE payroll_period_id = period_id
        ),
        cantidad_colaboradores = (
            SELECT COUNT(*)
            FROM payroll_records
            WHERE payroll_period_id = period_id
        )
    WHERE id = period_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_period_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_period_totals();

-- View for collaborator payroll history
CREATE OR REPLACE VIEW collaborator_payroll_history AS
SELECT
    pr.collaborator_id,
    c.nombre_completo,
    c.rut,
    c.type AS tipo_colaborador,
    pp.id AS periodo_id,
    pp.nombre AS periodo_nombre,
    pp.fecha_inicio,
    pp.fecha_fin,
    pr.sueldo_base,
    pr.cantidad_servicios,
    pr.total_extras,
    pr.bonos,
    pr.comisiones,
    pr.total_bruto,
    pr.descuentos,
    pr.adelantos,
    pr.total_deducciones,
    pr.total_neto,
    pr.aprobado,
    pp.estado AS periodo_estado,
    pr.created_at
FROM payroll_records pr
JOIN collaborators c ON pr.collaborator_id = c.id
JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
ORDER BY pp.fecha_inicio DESC, c.nombre_completo;

-- RLS Policies for new tables
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Payroll Periods Policies
CREATE POLICY "Users can view their funeral home's payroll periods"
ON payroll_periods FOR SELECT
TO authenticated
USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admin and ejecutivo can create payroll periods"
ON payroll_periods FOR INSERT
TO authenticated
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
);

CREATE POLICY "Admin and ejecutivo can update payroll periods"
ON payroll_periods FOR UPDATE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
)
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
);

CREATE POLICY "Admin can delete payroll periods"
ON payroll_periods FOR DELETE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
);

-- Payroll Records Policies
CREATE POLICY "Users can view their funeral home's payroll records"
ON payroll_records FOR SELECT
TO authenticated
USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admin and ejecutivo can create payroll records"
ON payroll_records FOR INSERT
TO authenticated
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
);

CREATE POLICY "Admin and ejecutivo can update payroll records"
ON payroll_records FOR UPDATE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
)
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
);

CREATE POLICY "Admin can delete payroll records"
ON payroll_records FOR DELETE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
);

-- Payment Receipts Policies
CREATE POLICY "Users can view their funeral home's payment receipts"
ON payment_receipts FOR SELECT
TO authenticated
USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admin and ejecutivo can create payment receipts"
ON payment_receipts FOR INSERT
TO authenticated
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
);

CREATE POLICY "Admin and ejecutivo can update payment receipts"
ON payment_receipts FOR UPDATE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'ejecutivo')
)
WITH CHECK (
    funeral_home_id = get_user_funeral_home_id()
);

CREATE POLICY "Admin can delete payment receipts"
ON payment_receipts FOR DELETE
TO authenticated
USING (
    funeral_home_id = get_user_funeral_home_id()
    AND (
        SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
);
