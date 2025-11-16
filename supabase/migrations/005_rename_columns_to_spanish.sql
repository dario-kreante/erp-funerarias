-- Migration: Rename all English column names to Spanish for consistency
-- This ensures the database schema matches the API usage patterns

-- funeral_homes table
ALTER TABLE funeral_homes RENAME COLUMN legal_name TO razon_social;
ALTER TABLE funeral_homes RENAME COLUMN trade_name TO nombre_fantasia;

-- branches table
ALTER TABLE branches RENAME COLUMN name TO nombre;
ALTER TABLE branches RENAME COLUMN address TO direccion;
ALTER TABLE branches RENAME COLUMN phone TO telefono;
ALTER TABLE branches RENAME COLUMN manager_name TO nombre_gerente;
ALTER TABLE branches RENAME COLUMN is_active TO estado_activo;

-- profiles table
ALTER TABLE profiles RENAME COLUMN full_name TO nombre_completo;
ALTER TABLE profiles RENAME COLUMN avatar_url TO url_avatar;
ALTER TABLE profiles RENAME COLUMN is_active TO estado_activo;

-- collaborators table
ALTER TABLE collaborators RENAME COLUMN full_name TO nombre_completo;
ALTER TABLE collaborators RENAME COLUMN position TO cargo;
ALTER TABLE collaborators RENAME COLUMN phone TO telefono;
ALTER TABLE collaborators RENAME COLUMN base_salary TO sueldo_base;
ALTER TABLE collaborators RENAME COLUMN payment_method TO metodo_pago;
ALTER TABLE collaborators RENAME COLUMN is_active TO estado_activo;
ALTER TABLE collaborators RENAME COLUMN notes TO notas;

-- plans table
ALTER TABLE plans RENAME COLUMN name TO nombre;
ALTER TABLE plans RENAME COLUMN description TO descripcion;
ALTER TABLE plans RENAME COLUMN base_price TO precio_base;
ALTER TABLE plans RENAME COLUMN notes TO notas;
ALTER TABLE plans RENAME COLUMN is_active TO estado_activo;

-- coffin_urns table
ALTER TABLE coffin_urns RENAME COLUMN type TO tipo;
ALTER TABLE coffin_urns RENAME COLUMN commercial_name TO nombre_comercial;
ALTER TABLE coffin_urns RENAME COLUMN material TO material;
ALTER TABLE coffin_urns RENAME COLUMN size TO tamano;
ALTER TABLE coffin_urns RENAME COLUMN category TO categoria;
ALTER TABLE coffin_urns RENAME COLUMN sale_price TO precio_venta;
ALTER TABLE coffin_urns RENAME COLUMN cost TO costo;
ALTER TABLE coffin_urns RENAME COLUMN stock_available TO stock_disponible;
ALTER TABLE coffin_urns RENAME COLUMN is_active TO estado_activo;

-- cemetery_crematoriums table
ALTER TABLE cemetery_crematoriums RENAME COLUMN name TO nombre;
ALTER TABLE cemetery_crematoriums RENAME COLUMN type TO tipo;
ALTER TABLE cemetery_crematoriums RENAME COLUMN address TO direccion;
ALTER TABLE cemetery_crematoriums RENAME COLUMN contact_info TO informacion_contacto;
ALTER TABLE cemetery_crematoriums RENAME COLUMN notes TO notas;
ALTER TABLE cemetery_crematoriums RENAME COLUMN is_active TO estado_activo;

-- vehicles table
ALTER TABLE vehicles RENAME COLUMN license_plate TO placa;
ALTER TABLE vehicles RENAME COLUMN vehicle_type TO tipo_vehiculo;
ALTER TABLE vehicles RENAME COLUMN capacity TO capacidad;
ALTER TABLE vehicles RENAME COLUMN status TO estado;
ALTER TABLE vehicles RENAME COLUMN notes TO notas;

-- suppliers table
ALTER TABLE suppliers RENAME COLUMN name TO nombre;
ALTER TABLE suppliers RENAME COLUMN business_type TO tipo_negocio;
ALTER TABLE suppliers RENAME COLUMN contact_info TO informacion_contacto;
ALTER TABLE suppliers RENAME COLUMN is_active TO estado_activo;

-- services table
ALTER TABLE services RENAME COLUMN service_number TO numero_servicio;
ALTER TABLE services RENAME COLUMN status TO estado;
ALTER TABLE services RENAME COLUMN service_type TO tipo_servicio;
ALTER TABLE services RENAME COLUMN general_notes TO notas_generales;
ALTER TABLE services RENAME COLUMN deceased_name TO nombre_fallecido;
ALTER TABLE services RENAME COLUMN deceased_rut TO rut_fallecido;
ALTER TABLE services RENAME COLUMN deceased_birth_date TO fecha_nacimiento_fallecido;
ALTER TABLE services RENAME COLUMN deceased_death_date TO fecha_fallecimiento;
ALTER TABLE services RENAME COLUMN deceased_death_place_type TO tipo_lugar_fallecimiento;
ALTER TABLE services RENAME COLUMN deceased_death_place TO lugar_fallecimiento;
ALTER TABLE services RENAME COLUMN deceased_death_cause TO causa_fallecimiento;
ALTER TABLE services RENAME COLUMN responsible_name TO nombre_responsable;
ALTER TABLE services RENAME COLUMN responsible_rut TO rut_responsable;
ALTER TABLE services RENAME COLUMN responsible_phone TO telefono_responsable;
ALTER TABLE services RENAME COLUMN responsible_email TO email_responsable;
ALTER TABLE services RENAME COLUMN responsible_address TO direccion_responsable;
ALTER TABLE services RENAME COLUMN responsible_relationship TO parentesco_responsable;
ALTER TABLE services RENAME COLUMN total_items TO total_items;
ALTER TABLE services RENAME COLUMN discount_amount TO monto_descuento;
ALTER TABLE services RENAME COLUMN discount_percentage TO porcentaje_descuento;
ALTER TABLE services RENAME COLUMN total_final TO total_final;
ALTER TABLE services RENAME COLUMN pickup_date TO fecha_recogida;
ALTER TABLE services RENAME COLUMN wake_start_date TO fecha_inicio_velatorio;
ALTER TABLE services RENAME COLUMN wake_room TO sala_velatorio;
ALTER TABLE services RENAME COLUMN religious_ceremony_date TO fecha_ceremonia_religiosa;
ALTER TABLE services RENAME COLUMN burial_cremation_date TO fecha_inhumacion_cremacion;
ALTER TABLE services RENAME COLUMN main_vehicle_id TO vehiculo_principal_id;
ALTER TABLE services RENAME COLUMN other_vehicles TO otros_vehiculos;
ALTER TABLE services RENAME COLUMN logistics_notes TO notas_logistica;

-- service_items table
ALTER TABLE service_items RENAME COLUMN item_type TO tipo_item;
ALTER TABLE service_items RENAME COLUMN category TO categoria;
ALTER TABLE service_items RENAME COLUMN description TO descripcion;
ALTER TABLE service_items RENAME COLUMN quantity TO cantidad;
ALTER TABLE service_items RENAME COLUMN unit_price TO precio_unitario;
ALTER TABLE service_items RENAME COLUMN tax_rate TO tasa_impuesto;
ALTER TABLE service_items RENAME COLUMN total_amount TO monto_total;

-- transactions table
ALTER TABLE transactions RENAME COLUMN transaction_number TO numero_transaccion;
ALTER TABLE transactions RENAME COLUMN transaction_date TO fecha_transaccion;
ALTER TABLE transactions RENAME COLUMN amount TO monto;
ALTER TABLE transactions RENAME COLUMN currency TO moneda;
ALTER TABLE transactions RENAME COLUMN payment_method TO metodo_pago;
ALTER TABLE transactions RENAME COLUMN account_destination TO cuenta_destino;
ALTER TABLE transactions RENAME COLUMN status TO estado;
ALTER TABLE transactions RENAME COLUMN observations TO observaciones;

-- expenses table
ALTER TABLE expenses RENAME COLUMN expense_date TO fecha_egreso;
ALTER TABLE expenses RENAME COLUMN supplier_name TO nombre_proveedor;
ALTER TABLE expenses RENAME COLUMN concept TO concepto;
ALTER TABLE expenses RENAME COLUMN amount TO monto;
ALTER TABLE expenses RENAME COLUMN category TO categoria;
ALTER TABLE expenses RENAME COLUMN tax_info TO info_impuestos;
ALTER TABLE expenses RENAME COLUMN invoice_number TO numero_factura;
ALTER TABLE expenses RENAME COLUMN status TO estado;

-- service_assignments table
ALTER TABLE service_assignments RENAME COLUMN role_in_service TO rol_en_servicio;
ALTER TABLE service_assignments RENAME COLUMN extra_type TO tipo_extra;
ALTER TABLE service_assignments RENAME COLUMN extra_amount TO monto_extra;
ALTER TABLE service_assignments RENAME COLUMN comments TO comentarios;

-- mortuary_quotas table
ALTER TABLE mortuary_quotas RENAME COLUMN applies TO aplica;
ALTER TABLE mortuary_quotas RENAME COLUMN entity TO entidad;
ALTER TABLE mortuary_quotas RENAME COLUMN entity_name TO nombre_entidad;
ALTER TABLE mortuary_quotas RENAME COLUMN invoiced_amount TO monto_facturado;
ALTER TABLE mortuary_quotas RENAME COLUMN payer TO pagador;
ALTER TABLE mortuary_quotas RENAME COLUMN status TO estado;
ALTER TABLE mortuary_quotas RENAME COLUMN request_date TO fecha_solicitud;
ALTER TABLE mortuary_quotas RENAME COLUMN resolution_date TO fecha_resolucion;
ALTER TABLE mortuary_quotas RENAME COLUMN payment_date TO fecha_pago;

-- documents table
ALTER TABLE documents RENAME COLUMN file_name TO nombre_archivo;
ALTER TABLE documents RENAME COLUMN file_url TO url_archivo;
ALTER TABLE documents RENAME COLUMN file_size TO tamano_archivo;
ALTER TABLE documents RENAME COLUMN mime_type TO tipo_mime;

-- service_procedures table
ALTER TABLE service_procedures RENAME COLUMN procedure_type TO tipo_tramite;
ALTER TABLE service_procedures RENAME COLUMN status TO estado;
ALTER TABLE service_procedures RENAME COLUMN completion_date TO fecha_completado;
ALTER TABLE service_procedures RENAME COLUMN notes TO notas;

-- activity_logs table
ALTER TABLE activity_logs RENAME COLUMN details TO detalles;

-- Update check constraints to use Spanish column names
ALTER TABLE coffin_urns DROP CONSTRAINT IF EXISTS coffin_urns_type_check;
ALTER TABLE coffin_urns ADD CONSTRAINT coffin_urns_tipo_check CHECK (tipo IN ('ataud', 'urna'));

ALTER TABLE cemetery_crematoriums DROP CONSTRAINT IF EXISTS cemetery_crematoriums_type_check;
ALTER TABLE cemetery_crematoriums ADD CONSTRAINT cemetery_crematoriums_tipo_check CHECK (tipo IN ('cementerio', 'crematorio'));

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_estado_check CHECK (estado IN ('disponible', 'en_mantenimiento'));

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_deceased_death_place_type_check;
ALTER TABLE services ADD CONSTRAINT services_tipo_lugar_fallecimiento_check CHECK (tipo_lugar_fallecimiento IN ('domicilio', 'hospital', 'via_publica', 'otro'));

ALTER TABLE service_items DROP CONSTRAINT IF EXISTS service_items_item_type_check;
ALTER TABLE service_items ADD CONSTRAINT service_items_tipo_item_check CHECK (tipo_item IN ('plan', 'ataud', 'urna', 'extra'));

ALTER TABLE service_procedures DROP CONSTRAINT IF EXISTS service_procedures_status_check;
ALTER TABLE service_procedures ADD CONSTRAINT service_procedures_estado_check CHECK (estado IN ('pendiente', 'en_proceso', 'completo'));

-- Update unique constraints to use Spanish column names
ALTER TABLE collaborators DROP CONSTRAINT IF EXISTS collaborators_funeral_home_id_rut_key;
ALTER TABLE collaborators ADD CONSTRAINT collaborators_funeral_home_id_rut_key UNIQUE(funeral_home_id, rut);

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_funeral_home_id_license_plate_key;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_funeral_home_id_placa_key UNIQUE(funeral_home_id, placa);

-- Recreate full-text search indexes with new column names
DROP INDEX IF EXISTS idx_services_deceased_name_trgm;
DROP INDEX IF EXISTS idx_services_responsible_name_trgm;

CREATE INDEX idx_services_nombre_fallecido_trgm ON services USING gin(nombre_fallecido gin_trgm_ops);
CREATE INDEX idx_services_nombre_responsable_trgm ON services USING gin(nombre_responsable gin_trgm_ops);

-- Update service_number generation function to use Spanish column name
CREATE OR REPLACE FUNCTION set_service_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_servicio IS NULL OR NEW.numero_servicio = '' THEN
        NEW.numero_servicio := generate_service_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update transaction_number generation function to use Spanish column name
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_transaccion IS NULL OR NEW.numero_transaccion = '' THEN
        NEW.numero_transaccion := generate_transaction_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update service_number generation function with Spanish column name
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'SRV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM services WHERE numero_servicio = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update transaction_number generation function with Spanish column name
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM transactions WHERE numero_transaccion = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;
