-- Update functions and views to use Spanish column names

-- Update calculate_service_total function
CREATE OR REPLACE FUNCTION calculate_service_total(service_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(monto_total), 0)
    INTO total
    FROM service_items
    WHERE service_id = service_uuid;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Update calculate_service_balance function
CREATE OR REPLACE FUNCTION calculate_service_balance(service_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total_amount DECIMAL(12, 2);
    paid_amount DECIMAL(12, 2);
BEGIN
    -- Get total final from service
    SELECT COALESCE(total_final, 0) INTO total_amount
    FROM services WHERE id = service_uuid;

    -- Get sum of paid transactions
    SELECT COALESCE(SUM(monto), 0) INTO paid_amount
    FROM transactions
    WHERE service_id = service_uuid AND estado = 'pagado';

    RETURN total_amount - paid_amount;
END;
$$ LANGUAGE plpgsql;

-- Update update_service_total trigger function
CREATE OR REPLACE FUNCTION update_service_total()
RETURNS TRIGGER AS $$
DECLARE
    service_uuid UUID;
    new_total DECIMAL(12, 2);
    discount_amount DECIMAL(12, 2);
    discount_percentage DECIMAL(5, 2);
    final_total DECIMAL(12, 2);
BEGIN
    -- Determine service_id
    IF TG_OP = 'DELETE' THEN
        service_uuid := OLD.service_id;
    ELSE
        service_uuid := NEW.service_id;
    END IF;

    -- Calculate new total from items
    new_total := calculate_service_total(service_uuid);

    -- Get discount info from service
    SELECT COALESCE(monto_descuento, 0), COALESCE(porcentaje_descuento, 0)
    INTO discount_amount, discount_percentage
    FROM services WHERE id = service_uuid;

    -- Calculate final total
    final_total := new_total;
    IF discount_amount > 0 THEN
        final_total := final_total - discount_amount;
    ELSIF discount_percentage > 0 THEN
        final_total := final_total * (1 - discount_percentage / 100);
    END IF;

    -- Update service
    UPDATE services
    SET
        total_items = new_total,
        total_final = final_total,
        updated_at = NOW()
    WHERE id = service_uuid;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update service_summary view
CREATE OR REPLACE VIEW service_summary AS
SELECT
    s.id,
    s.numero_servicio,
    s.funeral_home_id,
    s.branch_id,
    s.estado,
    s.tipo_servicio,
    s.nombre_fallecido,
    s.nombre_responsable,
    s.total_final,
    COALESCE(SUM(CASE WHEN t.estado = 'pagado' THEN t.monto ELSE 0 END), 0) AS monto_pagado,
    calculate_service_balance(s.id) AS saldo,
    COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'pagado') AS transacciones_pagadas,
    COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'pendiente') AS transacciones_pendientes,
    s.fecha_inhumacion_cremacion,
    s.fecha_inicio_velatorio,
    s.created_at,
    s.updated_at
FROM services s
LEFT JOIN transactions t ON t.service_id = s.id
GROUP BY s.id, s.numero_servicio, s.funeral_home_id, s.branch_id, s.estado,
         s.tipo_servicio, s.nombre_fallecido, s.nombre_responsable, s.total_final,
         s.fecha_inhumacion_cremacion, s.fecha_inicio_velatorio, s.created_at, s.updated_at;

-- Update payroll_summary view
CREATE OR REPLACE VIEW payroll_summary AS
SELECT
    c.id AS collaborator_id,
    c.funeral_home_id,
    c.nombre_completo,
    c.rut,
    c.type,
    c.sueldo_base,
    DATE_TRUNC('month', sa.created_at) AS mes_nomina,
    COUNT(DISTINCT sa.service_id) AS cantidad_servicios,
    SUM(sa.monto_extra) AS total_extras,
    CASE
        WHEN c.type = 'empleado' THEN COALESCE(c.sueldo_base, 0) + COALESCE(SUM(sa.monto_extra), 0)
        ELSE COALESCE(SUM(sa.monto_extra), 0)
    END AS total_a_pagar
FROM collaborators c
LEFT JOIN service_assignments sa ON sa.collaborator_id = c.id
LEFT JOIN services s ON s.id = sa.service_id
WHERE c.estado_activo = true
GROUP BY c.id, c.funeral_home_id, c.nombre_completo, c.rut, c.type, c.sueldo_base,
         DATE_TRUNC('month', sa.created_at);
