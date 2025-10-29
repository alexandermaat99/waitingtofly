-- Admin Management Schema
-- This table stores admin users and their roles

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  role character varying NOT NULL DEFAULT 'admin'::character varying,
  is_super_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.admins(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admins_active ON public.admins(is_active);
CREATE INDEX idx_admins_super_admin ON public.admins(is_super_admin);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON public.admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_admins_updated_at();

-- Insert the initial super admin
-- Note: Replace with actual super admin email
INSERT INTO public.admins (email, role, is_super_admin, is_active) VALUES
('admin@waitingtofly.com', 'super_admin', true, true);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_email text)
RETURNS boolean AS $$
DECLARE
    admin_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.admins 
        WHERE email = user_email 
        AND is_active = true
    ) INTO admin_exists;
    
    RETURN COALESCE(admin_exists, false);
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION is_user_super_admin(user_email text)
RETURNS boolean AS $$
DECLARE
    is_super boolean;
BEGIN
    SELECT is_super_admin INTO is_super
    FROM public.admins 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN COALESCE(is_super, false);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_email text)
RETURNS character varying AS $$
DECLARE
    admin_role character varying;
BEGIN
    SELECT role INTO admin_role
    FROM public.admins 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN COALESCE(admin_role, 'none');
END;
$$ LANGUAGE plpgsql;
