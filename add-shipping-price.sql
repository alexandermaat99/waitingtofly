-- Add shipping_price to site_config
-- This adds a shipping price configuration that can be managed in the admin panel

-- Option 1: Add shipping_price as a separate configuration entry
INSERT INTO public.site_config (config_key, config_value, description, category) 
VALUES (
  'shipping_price', 
  '0.00'::jsonb, 
  'Shipping price for physical book orders. Set to 0.00 for free shipping.',
  'book'
)
ON CONFLICT (config_key) DO UPDATE 
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();

-- The active_site_config view will automatically include this since it selects all active configs
-- No need to recreate the view

