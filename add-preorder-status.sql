-- Add preorder status configuration
INSERT INTO public.site_config (config_key, config_value, description, category) VALUES
('preorder_status', '{
  "status": "Sold Out",
  "message": "Thank you for the incredible support! Thank you for supporting the preorder! Official release coming soon."
}', 'Preorder window status and message', 'preorder')
ON CONFLICT (config_key) DO UPDATE
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();

