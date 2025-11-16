-- Enable RLS on all tables
ALTER TABLE funeral_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffin_urns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cemetery_crematoriums ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortuary_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's funeral_home_id
CREATE OR REPLACE FUNCTION get_user_funeral_home_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT funeral_home_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to branch
CREATE OR REPLACE FUNCTION user_has_branch_access(branch_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_branches 
        WHERE user_id = auth.uid() AND branch_id = branch_uuid
    ) OR get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funeral Homes policies
CREATE POLICY "Users can view their own funeral home"
    ON funeral_homes FOR SELECT
    USING (id = get_user_funeral_home_id());

CREATE POLICY "Admins can update their funeral home"
    ON funeral_homes FOR UPDATE
    USING (id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Branches policies
CREATE POLICY "Users can view branches of their funeral home"
    ON branches FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins can insert branches"
    ON branches FOR INSERT
    WITH CHECK (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update branches"
    ON branches FOR UPDATE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete branches"
    ON branches FOR DELETE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Profiles policies
CREATE POLICY "Users can view profiles in their funeral home"
    ON profiles FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update profiles"
    ON profiles FOR UPDATE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- User Branches policies
CREATE POLICY "Users can view user-branch assignments in their funeral home"
    ON user_branches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = user_branches.user_id
            AND p.funeral_home_id = get_user_funeral_home_id()
        )
    );

CREATE POLICY "Admins can manage user-branch assignments"
    ON user_branches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = user_branches.user_id
            AND p.funeral_home_id = get_user_funeral_home_id()
            AND get_user_role() = 'admin'
        )
    );

-- Collaborators policies
CREATE POLICY "Users can view collaborators in their funeral home"
    ON collaborators FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins and ejecutivos can insert collaborators"
    ON collaborators FOR INSERT
    WITH CHECK (
        funeral_home_id = get_user_funeral_home_id() 
        AND get_user_role() IN ('admin', 'ejecutivo')
    );

CREATE POLICY "Admins and ejecutivos can update collaborators"
    ON collaborators FOR UPDATE
    USING (
        funeral_home_id = get_user_funeral_home_id() 
        AND get_user_role() IN ('admin', 'ejecutivo')
    );

CREATE POLICY "Admins can delete collaborators"
    ON collaborators FOR DELETE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Plans policies
CREATE POLICY "Users can view plans in their funeral home"
    ON plans FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins can manage plans"
    ON plans FOR ALL
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Coffin Urns policies
CREATE POLICY "Users can view coffin_urns in their funeral home"
    ON coffin_urns FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins can manage coffin_urns"
    ON coffin_urns FOR ALL
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Cemetery Crematoriums policies
CREATE POLICY "Users can view cemetery_crematoriums in their funeral home"
    ON cemetery_crematoriums FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins can manage cemetery_crematoriums"
    ON cemetery_crematoriums FOR ALL
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Vehicles policies
CREATE POLICY "Users can view vehicles in their funeral home"
    ON vehicles FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins and operaciones can manage vehicles"
    ON vehicles FOR ALL
    USING (
        funeral_home_id = get_user_funeral_home_id() 
        AND get_user_role() IN ('admin', 'operaciones')
    );

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their funeral home"
    ON suppliers FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "Admins can manage suppliers"
    ON suppliers FOR ALL
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Services policies
CREATE POLICY "Users can view services in their funeral home and accessible branches"
    ON services FOR SELECT
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND (
            user_has_branch_access(branch_id)
            OR get_user_role() = 'admin'
        )
    );

CREATE POLICY "Ejecutivos and admins can insert services"
    ON services FOR INSERT
    WITH CHECK (
        funeral_home_id = get_user_funeral_home_id()
        AND user_has_branch_access(branch_id)
        AND get_user_role() IN ('admin', 'ejecutivo')
    );

CREATE POLICY "Users can update services based on role"
    ON services FOR UPDATE
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND (
            (get_user_role() = 'admin')
            OR (get_user_role() = 'ejecutivo' AND status IN ('borrador', 'confirmado'))
            OR (get_user_role() = 'operaciones' AND status IN ('confirmado', 'en_ejecucion'))
        )
    );

CREATE POLICY "Admins can delete services"
    ON services FOR DELETE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Service Items policies
CREATE POLICY "Users can view service_items for accessible services"
    ON service_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_items.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Ejecutivos and admins can manage service_items"
    ON service_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_items.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'ejecutivo')
        )
    );

-- Transactions policies
CREATE POLICY "Users can view transactions in their funeral home and accessible branches"
    ON transactions FOR SELECT
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND (
            user_has_branch_access(branch_id)
            OR get_user_role() = 'admin'
        )
    );

CREATE POLICY "Ejecutivos, caja and admins can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        funeral_home_id = get_user_funeral_home_id()
        AND user_has_branch_access(branch_id)
        AND get_user_role() IN ('admin', 'ejecutivo', 'caja')
    );

CREATE POLICY "Caja and admins can update transactions"
    ON transactions FOR UPDATE
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND get_user_role() IN ('admin', 'caja')
    );

CREATE POLICY "Admins can delete transactions"
    ON transactions FOR DELETE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Expenses policies
CREATE POLICY "Users can view expenses in their funeral home and accessible branches"
    ON expenses FOR SELECT
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND (
            user_has_branch_access(branch_id)
            OR get_user_role() = 'admin'
        )
    );

CREATE POLICY "Caja and admins can insert expenses"
    ON expenses FOR INSERT
    WITH CHECK (
        funeral_home_id = get_user_funeral_home_id()
        AND user_has_branch_access(branch_id)
        AND get_user_role() IN ('admin', 'caja')
    );

CREATE POLICY "Caja and admins can update expenses"
    ON expenses FOR UPDATE
    USING (
        funeral_home_id = get_user_funeral_home_id()
        AND get_user_role() IN ('admin', 'caja')
    );

CREATE POLICY "Admins can delete expenses"
    ON expenses FOR DELETE
    USING (funeral_home_id = get_user_funeral_home_id() AND get_user_role() = 'admin');

-- Service Assignments policies
CREATE POLICY "Users can view service_assignments for accessible services"
    ON service_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_assignments.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Operaciones and admins can manage service_assignments"
    ON service_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_assignments.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'operaciones')
        )
    );

-- Mortuary Quotas policies
CREATE POLICY "Users can view mortuary_quotas for accessible services"
    ON mortuary_quotas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = mortuary_quotas.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Ejecutivos, caja and admins can manage mortuary_quotas"
    ON mortuary_quotas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = mortuary_quotas.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'ejecutivo', 'caja')
        )
    );

-- Documents policies
CREATE POLICY "Users can view documents for accessible services"
    ON documents FOR SELECT
    USING (
        (service_id IS NULL OR EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = documents.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        ))
        OR (mortuary_quota_id IS NULL OR EXISTS (
            SELECT 1 FROM mortuary_quotas mq
            JOIN services s ON s.id = mq.service_id
            WHERE mq.id = documents.mortuary_quota_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        ))
    );

CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    WITH CHECK (true); -- File upload validation happens at application level

CREATE POLICY "Admins can delete documents"
    ON documents FOR DELETE
    USING (get_user_role() = 'admin');

-- Service Procedures policies
CREATE POLICY "Users can view service_procedures for accessible services"
    ON service_procedures FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_procedures.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND (
                user_has_branch_access(s.branch_id)
                OR get_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Users can manage service_procedures based on role"
    ON service_procedures FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_procedures.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'ejecutivo', 'operaciones', 'caja')
        )
    );

-- Activity Logs policies
CREATE POLICY "Users can view activity_logs in their funeral home"
    ON activity_logs FOR SELECT
    USING (funeral_home_id = get_user_funeral_home_id());

CREATE POLICY "System can insert activity_logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true); -- Application level validation

