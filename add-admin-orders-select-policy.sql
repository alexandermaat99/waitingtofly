-- Add policy to allow admins to view all orders
-- This is needed for the admin dashboard orders page

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

