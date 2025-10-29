-- Enable Row Level Security (RLS) and create policies for all public tables
-- This script addresses the security warnings without breaking existing functionality

-- ==============================================
-- 1. ADMINS TABLE
-- ==============================================

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view admins
CREATE POLICY "Authenticated users can view admins" ON public.admins
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only super admins can insert new admins
CREATE POLICY "Super admins can insert admins" ON public.admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_super_admin = true 
            AND is_active = true
        )
    );

-- Policy: Only super admins can update admins
CREATE POLICY "Super admins can update admins" ON public.admins
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_super_admin = true 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_super_admin = true 
            AND is_active = true
        )
    );

-- Policy: Only super admins can delete admins
CREATE POLICY "Super admins can delete admins" ON public.admins
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_super_admin = true 
            AND is_active = true
        )
    );

-- ==============================================
-- 2. MAILING_LIST TABLE
-- ==============================================

-- Enable RLS on mailing_list table
ALTER TABLE public.mailing_list ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert into mailing list (for public signup)
CREATE POLICY "Anyone can subscribe to mailing list" ON public.mailing_list
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Only authenticated users can view mailing list
CREATE POLICY "Authenticated users can view mailing list" ON public.mailing_list
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can update mailing list
CREATE POLICY "Admins can update mailing list" ON public.mailing_list
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Policy: Only admins can delete from mailing list
CREATE POLICY "Admins can delete from mailing list" ON public.mailing_list
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- ==============================================
-- 3. ORDERS TABLE
-- ==============================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (email = (auth.jwt() ->> 'email'));

-- Policy: Anyone can create orders (for checkout process)
CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Only admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Policy: Only admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- ==============================================
-- 4. SITE_CONFIG TABLE
-- ==============================================

-- Enable RLS on site_config table
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active site config (for public pages)
CREATE POLICY "Anyone can view active site config" ON public.site_config
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Policy: Only admins can view all site config (including inactive)
CREATE POLICY "Admins can view all site config" ON public.site_config
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Policy: Only admins can insert site config
CREATE POLICY "Admins can insert site config" ON public.site_config
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Policy: Only admins can update site config
CREATE POLICY "Admins can update site config" ON public.site_config
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- Policy: Only admins can delete site config
CREATE POLICY "Admins can delete site config" ON public.site_config
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

-- ==============================================
-- 5. CREATE HELPER FUNCTIONS FOR ADMIN CHECKS
-- ==============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.jwt() ->> 'email' 
        AND is_active = true
    );
$$;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.jwt() ->> 'email' 
        AND is_super_admin = true 
        AND is_active = true
    );
$$;

-- Function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.admins 
         WHERE email = auth.jwt() ->> 'email' 
         AND is_active = true),
        'none'
    );
$$;

-- ==============================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailing_list TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_role() TO anon, authenticated;

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admins', 'mailing_list', 'orders', 'site_config');

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
