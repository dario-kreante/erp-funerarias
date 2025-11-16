-- Function to calculate service total from items
CREATE OR REPLACE FUNCTION calculate_service_total(service_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total
    FROM service_items
    WHERE service_id = service_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate service balance (total - paid transactions)
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
    SELECT COALESCE(SUM(amount), 0) INTO paid_amount
    FROM transactions
    WHERE service_id = service_uuid AND status = 'pagado';
    
    RETURN total_amount - paid_amount;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update service total when service_items change
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
    SELECT COALESCE(discount_amount, 0), COALESCE(discount_percentage, 0)
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

CREATE TRIGGER service_items_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON service_items
    FOR EACH ROW EXECUTE FUNCTION update_service_total();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_funeral_home_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get funeral_home_id and branch_id from context
    -- This should be set by the application, but we'll try to infer it
    IF p_entity_type = 'service' THEN
        SELECT funeral_home_id, branch_id INTO v_funeral_home_id, v_branch_id
        FROM services WHERE id = p_entity_id;
    ELSIF p_entity_type = 'transaction' THEN
        SELECT funeral_home_id, branch_id INTO v_funeral_home_id, v_branch_id
        FROM transactions WHERE id = p_entity_id;
    ELSIF p_entity_type = 'expense' THEN
        SELECT funeral_home_id, branch_id INTO v_funeral_home_id, v_branch_id
        FROM expenses WHERE id = p_entity_id;
    ELSE
        v_funeral_home_id := get_user_funeral_home_id();
    END IF;
    
    INSERT INTO activity_logs (
        funeral_home_id,
        branch_id,
        user_id,
        entity_type,
        entity_id,
        action,
        details
    ) VALUES (
        v_funeral_home_id,
        v_branch_id,
        auth.uid(),
        p_entity_type,
        p_entity_id,
        p_action,
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for service summary with financial info
CREATE OR REPLACE VIEW service_summary AS
SELECT 
    s.id,
    s.service_number,
    s.funeral_home_id,
    s.branch_id,
    s.status,
    s.service_type,
    s.deceased_name,
    s.responsible_name,
    s.total_final,
    COALESCE(SUM(CASE WHEN t.status = 'pagado' THEN t.amount ELSE 0 END), 0) AS paid_amount,
    calculate_service_balance(s.id) AS balance,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'pagado') AS paid_transactions_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'pendiente') AS pending_transactions_count,
    s.burial_cremation_date,
    s.wake_start_date,
    s.created_at,
    s.updated_at
FROM services s
LEFT JOIN transactions t ON t.service_id = s.id
GROUP BY s.id, s.service_number, s.funeral_home_id, s.branch_id, s.status, 
         s.service_type, s.deceased_name, s.responsible_name, s.total_final,
         s.burial_cremation_date, s.wake_start_date, s.created_at, s.updated_at;

-- View for payroll summary
CREATE OR REPLACE VIEW payroll_summary AS
SELECT 
    c.id AS collaborator_id,
    c.funeral_home_id,
    c.full_name,
    c.rut,
    c.type,
    c.base_salary,
    DATE_TRUNC('month', sa.created_at) AS payroll_month,
    COUNT(DISTINCT sa.service_id) AS services_count,
    SUM(sa.extra_amount) AS total_extras,
    CASE 
        WHEN c.type = 'empleado' THEN COALESCE(c.base_salary, 0) + COALESCE(SUM(sa.extra_amount), 0)
        ELSE COALESCE(SUM(sa.extra_amount), 0)
    END AS total_to_pay
FROM collaborators c
LEFT JOIN service_assignments sa ON sa.collaborator_id = c.id
LEFT JOIN services s ON s.id = sa.service_id
WHERE c.is_active = true
GROUP BY c.id, c.funeral_home_id, c.full_name, c.rut, c.type, c.base_salary, 
         DATE_TRUNC('month', sa.created_at);

