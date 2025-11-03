-- Site Configuration Schema
-- This table will store all site configuration that was previously in constants.ts
-- Allows admin to update content without code changes

CREATE TABLE public.site_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_key character varying NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  category character varying DEFAULT 'general'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_config_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX idx_site_config_key ON public.site_config(config_key);
CREATE INDEX idx_site_config_category ON public.site_config(category);
CREATE INDEX idx_site_config_active ON public.site_config(is_active);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_site_config_updated_at 
    BEFORE UPDATE ON public.site_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_site_config_updated_at();

-- Insert initial configuration data
INSERT INTO public.site_config (config_key, config_value, description, category) VALUES
-- Book Information
('book_info', '{
  "title": "Waiting to Fly: A Laotian Refugee Girl''s Journey in Nong Khai",
  "author": "Samly Maat",
  "genre": "Memoir • Biography • History",
  "description": "In Waiting to Fly, the young Laotian girl from Before I Became a Refugee Girl faces life inside the Nong Khai refugee camp. Through loss, laughter, and quiet moments of hope, she learns that freedom begins with courage. It is a story about finding light in uncertainty and about how waiting can become a kind of flight.",
  "releaseDate": "December 2025",
  "formats": ["Hardcover", "Paperback", "eBook"],
  "preorderBonus": "Preorder now and get a singed copy of the book!",
  "series": "Memoir Series",
  "previousBook": "Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era",
  "previousBookUrl": "https://a.co/d/623YZo9",
  "coverImage": "/images/bookImage.png"
}', 'Main book information and details', 'book'),

-- Book Formats and Pricing
('book_formats', '{
  "hardcover": {
    "name": "Hardcover",
    "price": 24.99,
    "description": "Premium hardcover edition with dust jacket"
  },
  "paperback": {
    "name": "Paperback", 
    "price": 18.99,
    "description": "Standard paperback edition"
  },
  "ebook": {
    "name": "E-book",
    "price": 12.99,
    "description": "Digital version for e-readers and devices"
  },
  "audiobook": {
    "name": "Audiobook",
    "price": 19.99,
    "description": "Narrated audio version"
  }
}', 'Book format options and pricing', 'book'),

-- Author Information
('author_info', '{
  "name": "Samly Maat",
  "bio": "Dr. Samly Maat is an author and speaker whose life traces a remarkable journey from the rice fields of Laos to the refugee camps of Thailand, from the decks of the U.S. Navy to a distinguished career in engineering and leadership.",
  "personalNote": "Through her memoir collection, <strong><em>The Becoming Series</em></strong>, she shares true stories of courage, perseverance, and transformation, showing that no matter where you begin, you have the power to rise. She writes to remind us that strength is not born in comfort, but in courage.",
  "quote": "Every refugee carries within them the seeds of hope and the strength to rebuild. This is our story of survival, resilience, and ultimately, triumph.",
  "photo": "/images/author_photo.jpg",
  "education": [
    {
      "degree": "Doctor of Management (D.M.), Organizational Leadership",
      "school": "University of Phoenix",
      "years": "2003 - 2009",
      "description": "Doctor of Management with the emphasis in Organizational Leadership"
    },
    {
      "degree": "Master of Science (M.S.), Technology Management", 
      "school": "National University",
      "years": "1996 - 1997",
      "description": "Master of Information Technology"
    },
    {
      "degree": "Bachelor of Science (B.S.), Information Technology",
      "school": "San Diego State University", 
      "years": "1991 - 1993",
      "description": "Bachelor of Science in Information Technology"
    }
  ],
  "previousWorks": [
    {
      "title": "Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era",
      "year": "2020",
      "achievement": "First Book in Memoir Series",
      "url": "https://a.co/d/623YZo9"
    }
  ]
}', 'Author biography and information', 'author'),

-- Testimonials
('testimonials', '[
  {
    "quote": "Dr. Samly Maat''s story helped me see my own strength again. Her courage reminds me that hope never truly leaves us—it only waits for us to rise.",
    "author": "Abigail Measles",
    "role": "Student of Southeast Asian Studies"
  },
  {
    "quote": "Every chapter touched my heart. I cried, I smiled, and I felt less alone in my own struggles. This book taught me that healing is possible, one step at a time.",
    "author": "Professor James Morrison", 
    "role": "Historian and Refugee Studies Professor"
  },
  {
    "quote": "Her words are a mirror for anyone who has faced fear or loss. She shows that even the smallest act of faith can lead to freedom.",
    "author": "Maria Viengchang",
    "role": "Literary Critic and Researcher"
  }
]', 'Customer testimonials and reviews', 'testimonials'),

-- Preorder Statistics
('preorder_stats', '{
  "earlyPreorders": "500+",
  "rating": "4.9/5",
  "countries": "50+"
}', 'Preorder statistics and metrics', 'stats'),

-- Preorder Benefits
('preorder_benefits', '[
  "Early access to the first 3 chapters",
  "Signed copy (while supplies last)",
  "Exclusive author updates and behind-the-scenes content", 
  "Free shipping on all preorders"
]', 'Benefits for preordering the book', 'preorder'),

-- Site Configuration
('site_config', '{
  "name": "Waiting to Fly",
  "tagline": "A powerful memoir about resilience, hope, and the refugee experience during the Vietnam War era.",
  "socialLinks": {
    "instagram": "#", 
    "facebook": "#",
    "linkedin": "#"
  }
}', 'General site configuration', 'site'),

-- Footer Taglines
('footer_taglines', '{
  "primary": "A powerful memoir about resilience, hope, and the refugee experience during the Vietnam War era.",
  "alternative": "Discover the untold stories of courage, survival, and the human spirit in the face of adversity.",
  "inspirational": "Inspiring resilience and hope—discover true stories of overcoming adversity, reclaiming freedom, and finding strength on every page.",
  "journey": "Follow one woman''s extraordinary journey from refugee camp to freedom, and find your own path to resilience."
}', 'Footer tagline variations', 'site');

-- Create a view for easy access to active configurations
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

-- Create a function to get configuration by key
CREATE OR REPLACE FUNCTION get_site_config(config_key_param text)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT config_value INTO result
    FROM public.site_config
    WHERE config_key = config_key_param AND is_active = true;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create a function to update configuration
CREATE OR REPLACE FUNCTION update_site_config(
    config_key_param text,
    config_value_param jsonb,
    description_param text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    UPDATE public.site_config
    SET 
        config_value = config_value_param,
        description = COALESCE(description_param, description),
        updated_at = now()
    WHERE config_key = config_key_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
