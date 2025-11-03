-- Add bundle format to book_formats in site_config
-- This SQL assumes you're updating the book_formats config value
-- You'll need to update this through your admin panel or directly in the database

-- Example: If your book_formats config currently looks like:
-- {
--   "hardcover": {"name": "Hardcover", "price": 20.00},
--   "paperback": {"name": "Paperback", "price": 15.00}
-- }
--
-- You would update it to:
-- {
--   "hardcover": {"name": "Hardcover", "price": 20.00},
--   "paperback": {"name": "Paperback", "price": 15.00},
--   "bundle": {"name": "Bundle: Book 1 + Book 2", "price": 22.48}
-- }

-- To add via SQL (adjust the config_value based on your current structure):
UPDATE site_config 
SET config_value = jsonb_set(
  config_value::jsonb, 
  '{bundle}', 
  '{"name": "Bundle: Book 1 + Book 2", "price": 22.48}'::jsonb
)
WHERE config_key = 'book_formats' AND is_active = true;

-- Or if you need to set it from scratch:
-- INSERT INTO site_config (config_key, config_value, is_active)
-- VALUES ('book_formats', 
--   '{"hardcover": {"name": "Hardcover", "price": 20.00}, "paperback": {"name": "Paperback", "price": 15.00}, "bundle": {"name": "Bundle: Book 1 + Book 2", "price": 22.48}}'::jsonb,
--   true)
-- ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;

