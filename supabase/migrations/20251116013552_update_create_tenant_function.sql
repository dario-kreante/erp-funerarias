-- Update create_tenant_for_user function with service_role permissions and PostgREST cache refresh
-- This ensures the function is accessible via the admin client and PostgREST recognizes it

CREATE OR REPLACE FUNCTION public.create_tenant_for_user(
    user_id UUID,
    funeral_home_legal_name TEXT,
    funeral_home_trade_name TEXT,
    funeral_home_rut TEXT,
    admin_full_name TEXT,
    admin_email TEXT,
    branch_name TEXT,
    branch_address TEXT
)
RETURNS UUID AS $$
DECLARE
    v_funeral_home_id UUID;
    v_branch_id UUID;
BEGIN
    -- Ensure the auth user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'Auth user with id % does not exist', user_id;
    END IF;

    -- Temporarily disable RLS by setting role to postgres
    -- This allows the SECURITY DEFINER function to create the initial tenant structure
    -- Note: This only works if the function is called within a transaction
    SET LOCAL role = 'postgres';

    -- Create funeral home
    INSERT INTO funeral_homes (legal_name, trade_name, rut, email)
    VALUES (funeral_home_legal_name, funeral_home_trade_name, funeral_home_rut, admin_email)
    RETURNING id INTO v_funeral_home_id;

    -- Create initial branch
    INSERT INTO branches (funeral_home_id, name, address)
    VALUES (v_funeral_home_id, COALESCE(branch_name, 'Casa matriz'), branch_address)
    RETURNING id INTO v_branch_id;

    -- Create admin profile
    INSERT INTO profiles (id, funeral_home_id, full_name, email, role)
    VALUES (user_id, v_funeral_home_id, admin_full_name, admin_email, 'admin');

    -- Assign admin to branch
    INSERT INTO user_branches (user_id, branch_id)
    VALUES (user_id, v_branch_id);

    -- Reset role (though it will be reset automatically at transaction end)
    RESET role;

    RETURN v_funeral_home_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Best-effort cleanup on failure
        IF v_branch_id IS NOT NULL THEN
            DELETE FROM user_branches WHERE user_id = user_id AND branch_id = v_branch_id;
            DELETE FROM branches WHERE id = v_branch_id;
        END IF;

        IF v_funeral_home_id IS NOT NULL THEN
            DELETE FROM profiles WHERE id = user_id AND funeral_home_id = v_funeral_home_id;
            DELETE FROM funeral_homes WHERE id = v_funeral_home_id;
        END IF;

        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Grant execute permissions including service_role
GRANT EXECUTE ON FUNCTION public.create_tenant_for_user(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT
) TO anon, authenticated, service_role;

-- Refresh PostgREST schema cache to recognize the function
NOTIFY pgrst, 'reload schema';

