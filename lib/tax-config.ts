// Tax Configuration
// Update these rates based on your business requirements and tax obligations

export interface TaxConfig {
  // Digital products tax exemption
  digitalProductsExempt: boolean;
  
  // Business location for tax nexus determination
  businessLocation: {
    country: string;
    state?: string;
  };
  
  // Tax rates by location
  taxRates: {
    [key: string]: number;
  };
}

export const TAX_CONFIG: TaxConfig = {
  // Set to true if digital products (ebooks, audiobooks) are exempt from tax in your jurisdiction
  digitalProductsExempt: true,
  
  // Your business location - affects which taxes you need to collect
  businessLocation: {
    country: 'US',
    state: 'CA', // Update this to your business state
  },
  
  // Tax rates by location (decimal format: 0.0875 = 8.75%)
  taxRates: {
    // US States - Sales Tax Rates (as of 2024)
    'US-AL': 0.04,   // Alabama 4%
    'US-AK': 0.00,   // Alaska 0% (no state sales tax)
    'US-AZ': 0.056,  // Arizona 5.6%
    'US-AR': 0.065,  // Arkansas 6.5%
    'US-CA': 0.0725, // California 7.25%
    'US-CO': 0.029,  // Colorado 2.9%
    'US-CT': 0.0635, // Connecticut 6.35%
    'US-DE': 0.00,   // Delaware 0% (no sales tax)
    'US-FL': 0.06,   // Florida 6%
    'US-GA': 0.04,   // Georgia 4%
    'US-HI': 0.04,   // Hawaii 4%
    'US-ID': 0.06,   // Idaho 6%
    'US-IL': 0.0625, // Illinois 6.25%
    'US-IN': 0.07,   // Indiana 7%
    'US-IA': 0.06,   // Iowa 6%
    'US-KS': 0.065,  // Kansas 6.5%
    'US-KY': 0.06,   // Kentucky 6%
    'US-LA': 0.045,  // Louisiana 4.45%
    'US-ME': 0.055,  // Maine 5.5%
    'US-MD': 0.06,   // Maryland 6%
    'US-MA': 0.0625, // Massachusetts 6.25%
    'US-MI': 0.06,   // Michigan 6%
    'US-MN': 0.06875,// Minnesota 6.875%
    'US-MS': 0.07,   // Mississippi 7%
    'US-MO': 0.04225,// Missouri 4.225%
    'US-MT': 0.00,   // Montana 0% (no sales tax)
    'US-NE': 0.055,  // Nebraska 5.5%
    'US-NV': 0.0685, // Nevada 6.85%
    'US-NH': 0.00,   // New Hampshire 0% (no sales tax)
    'US-NJ': 0.06625,// New Jersey 6.625%
    'US-NM': 0.05125,// New Mexico 5.125%
    'US-NY': 0.04,   // New York 4%
    'US-NC': 0.0475, // North Carolina 4.75%
    'US-ND': 0.05,   // North Dakota 5%
    'US-OH': 0.0575, // Ohio 5.75%
    'US-OK': 0.045,  // Oklahoma 4.5%
    'US-OR': 0.00,   // Oregon 0% (no sales tax)
    'US-PA': 0.06,   // Pennsylvania 6%
    'US-RI': 0.07,   // Rhode Island 7%
    'US-SC': 0.06,   // South Carolina 6%
    'US-SD': 0.045,  // South Dakota 4.5%
    'US-TN': 0.07,   // Tennessee 7%
    'US-TX': 0.0625, // Texas 6.25%
    'US-UT': 0.047,  // Utah 4.7%
    'US-VT': 0.06,   // Vermont 6%
    'US-VA': 0.053,  // Virginia 5.3%
    'US-WA': 0.065,  // Washington 6.5%
    'US-WV': 0.06,   // West Virginia 6%
    'US-WI': 0.05,   // Wisconsin 5%
    'US-WY': 0.04,   // Wyoming 4%
    'US-DC': 0.06,   // District of Columbia 6%
    
    // Default for any unrecognized US locations
    'OTHER': 0.00,   // No tax for unrecognized locations
  },
};

// Helper function to calculate tax
export const calculateTax = (
  subtotal: number, 
  country: string, 
  state?: string, 
  isDigital: boolean = false
): { tax: number; rate: number } => {
  // Check if digital products are exempt
  if (isDigital && TAX_CONFIG.digitalProductsExempt) {
    return { tax: 0, rate: 0 };
  }

  // Determine tax key
  const taxKey = state && country === 'US' ? `US-${state}` : country;
  const rate = TAX_CONFIG.taxRates[taxKey] || TAX_CONFIG.taxRates['OTHER'];
  
  const tax = Math.round(subtotal * rate * 100) / 100; // Round to 2 decimal places
  
  return { tax, rate };
};

// Helper function to get tax rate for display
export const getTaxRateForDisplay = (country: string, state?: string): number => {
  const taxKey = state && country === 'US' ? `US-${state}` : country;
  const rate = TAX_CONFIG.taxRates[taxKey] || TAX_CONFIG.taxRates['OTHER'];
  return rate * 100; // Convert to percentage for display
};
