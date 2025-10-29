-- Update the active_site_config view to only show active configurations
-- This ensures consistency with the API that now filters by is_active = true

DROP VIEW IF EXISTS public.active_site_config;

CREATE VIEW public.active_site_config AS
SELECT 
    config_key,
    config_value,
    description,
    category,
    updated_at
FROM public.site_config 
WHERE is_active = true
ORDER BY category, config_key;
