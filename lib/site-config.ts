import { createClient } from '@/lib/supabase/server';

// Cache for configuration data
const configCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

export async function getSiteConfig<T = any>(key: string): Promise<T | null> {
  try {
    // Check cache first
    const cached = configCache.get(key) as CacheEntry;
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Fetch from database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_config')
      .select('config_value')
      .eq('config_key', key)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error(`Failed to fetch config for key: ${key}`, error);
      return null;
    }

    // Cache the result
    configCache.set(key, {
      data: data.config_value,
      timestamp: Date.now()
    });

    return data.config_value as T;
  } catch (error) {
    console.error(`Error fetching site config for key: ${key}`, error);
    return null;
  }
}

// Convenience functions for common configurations
export async function getBookInfo() {
  return getSiteConfig('book_info');
}

export async function getBookFormats() {
  return getSiteConfig('book_formats');
}

export async function getAuthorInfo() {
  return getSiteConfig('author_info');
}

export async function getTestimonials() {
  return getSiteConfig('testimonials');
}

export async function getPreorderStats() {
  return getSiteConfig('preorder_stats');
}

export async function getPreorderBenefits() {
  return getSiteConfig('preorder_benefits');
}

export async function getSiteConfigData() {
  return getSiteConfig('site_config');
}

export async function getShippingPrice(): Promise<number> {
  const price = await getSiteConfig<number>('shipping_price');
  return typeof price === 'number' ? price : 0;
}


// Clear cache (useful for admin updates)
export function clearConfigCache() {
  configCache.clear();
}

// Clear cache for specific key
export function clearConfigCacheKey(key: string) {
  configCache.delete(key);
}
