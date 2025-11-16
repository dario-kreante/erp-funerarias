-- Security hardening migration
-- Fix vulnerable RLS policies that allow unrestricted inserts

-- Drop insecure documents INSERT policy
DROP POLICY IF EXISTS "Users can upload documents" ON documents;

-- Create secure documents INSERT policy
CREATE POLICY "Users can upload documents for accessible services"
    ON documents FOR INSERT
    WITH CHECK (
        (service_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = documents.service_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'ejecutivo', 'operaciones')
        ))
        OR (mortuary_quota_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM mortuary_quotas mq
            JOIN services s ON s.id = mq.service_id
            WHERE mq.id = documents.mortuary_quota_id
            AND s.funeral_home_id = get_user_funeral_home_id()
            AND user_has_branch_access(s.branch_id)
            AND get_user_role() IN ('admin', 'ejecutivo', 'caja')
        ))
    );

-- Drop insecure activity_logs INSERT policy
DROP POLICY IF EXISTS "System can insert activity_logs" ON activity_logs;

-- Create secure activity_logs INSERT policy
-- Only allow inserts for the user's own funeral home
CREATE POLICY "Users can insert activity_logs for their funeral home"
    ON activity_logs FOR INSERT
    WITH CHECK (
        funeral_home_id = get_user_funeral_home_id()
        AND (
            user_id = auth.uid()
            OR get_user_role() = 'admin'
        )
    );

-- Add UPDATE policy for documents (currently missing)
CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (
        uploaded_by = auth.uid()
        OR get_user_role() = 'admin'
    );

-- Add index for better query performance on security checks
CREATE INDEX IF NOT EXISTS idx_profiles_user_funeral_home ON profiles(id, funeral_home_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_services_funeral_home_branch ON services(funeral_home_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_documents_service_id ON documents(service_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_funeral_home ON activity_logs(funeral_home_id);

-- Add constraint to prevent orphaned documents
ALTER TABLE documents
    ADD CONSTRAINT documents_must_have_parent
    CHECK (service_id IS NOT NULL OR mortuary_quota_id IS NOT NULL);
