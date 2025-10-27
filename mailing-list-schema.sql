-- Mailing List Schema
-- This table will store email subscribers for your newsletter/mailing list

CREATE TABLE public.mailing_list (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  first_name character varying,
  last_name character varying,
  source character varying DEFAULT 'website'::character varying CHECK (source::text = ANY (ARRAY['website'::character varying, 'preorder'::character varying, 'order'::character varying, 'manual'::character varying]::text[])),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'unsubscribed'::character varying, 'bounced'::character varying, 'complained'::character varying]::text[])),
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  last_email_sent timestamp with time zone,
  email_count integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mailing_list_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX idx_mailing_list_email ON public.mailing_list(email);
CREATE INDEX idx_mailing_list_status ON public.mailing_list(status);
CREATE INDEX idx_mailing_list_subscribed_at ON public.mailing_list(subscribed_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_mailing_list_updated_at 
    BEFORE UPDATE ON public.mailing_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view to see active subscribers
CREATE VIEW public.active_subscribers AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    source,
    subscribed_at,
    last_email_sent,
    email_count
FROM public.mailing_list 
WHERE status = 'active'
ORDER BY subscribed_at DESC;

-- Optional: Create a function to add email from orders to mailing list
-- This will help you automatically add customers to your mailing list
CREATE OR REPLACE FUNCTION add_customer_to_mailing_list()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add to mailing list if order is completed and email doesn't already exist
    IF NEW.status = 'completed' AND NOT EXISTS (
        SELECT 1 FROM public.mailing_list WHERE email = NEW.email
    ) THEN
        INSERT INTO public.mailing_list (email, first_name, last_name, source, status)
        VALUES (
            NEW.email,
            SPLIT_PART(NEW.name, ' ', 1), -- Extract first name
            CASE 
                WHEN POSITION(' ' IN NEW.name) > 0 
                THEN SUBSTRING(NEW.name FROM POSITION(' ' IN NEW.name) + 1)
                ELSE ''
            END, -- Extract last name
            'order',
            'active'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically add completed order customers to mailing list
CREATE TRIGGER add_customer_to_mailing_list_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION add_customer_to_mailing_list();
