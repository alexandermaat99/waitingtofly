import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountFromStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      subtotal,
      shippingCountry = 'US',
      shippingState,
      shippingCity,
      shippingPostalCode,
      isDigital = false,
    } = body;

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json(
        { error: 'Subtotal is required' },
        { status: 400 }
      );
    }

    if (!shippingPostalCode) {
      return NextResponse.json(
        { error: 'ZIP code is required for tax calculation' },
        { status: 400 }
      );
    }

    try {
      // Use Stripe Tax Calculation API to get accurate ZIP-based tax
      // This creates a temporary calculation object without creating a payment intent
      const productTaxCode = isDigital ? 'txcd_31000000' : 'txcd_99999999';
      
      console.log('📊 Stripe Tax Calculation Request:', {
        subtotal,
        zip: shippingPostalCode,
        state: shippingState,
        city: shippingCity,
        country: shippingCountry,
        isDigital,
        tax_code: productTaxCode,
      });
      
      const calculation = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: [{
          amount: Math.round(subtotal * 100), // Amount in cents
          reference: 'book_preorder',
          tax_code: productTaxCode, // Digital vs physical
        }],
        customer_details: {
          address: {
            line1: '1 Main St', // Placeholder - Stripe only needs ZIP for tax calculation
            city: shippingCity || 'City',
            state: shippingState || '',
            postal_code: shippingPostalCode,
            country: shippingCountry,
          },
          address_source: 'shipping',
        },
      });

      console.log('✅ Stripe Tax Calculation Response:', {
        tax_amount_exclusive: calculation.tax_amount_exclusive,
        tax_amount_inclusive: calculation.tax_amount_inclusive,
        tax_breakdown: calculation.tax_breakdown,
        id: calculation.id,
      });

      // Extract tax amount from calculation
      // tax_amount_exclusive is the tax amount (in cents) added to the subtotal
      const taxAmount = calculation.tax_amount_exclusive || 0;
      const tax = formatAmountFromStripe(taxAmount);
      const total = subtotal + tax;
      const taxRate = tax > 0 ? (tax / subtotal) : 0;

      // Log warning if tax is 0 but it shouldn't be
      if (tax === 0 && !isDigital && shippingCountry === 'US' && shippingState !== 'AK' && shippingState !== 'DE' && shippingState !== 'MT' && shippingState !== 'NH' && shippingState !== 'OR') {
        console.warn('⚠️ Stripe Tax returned $0 tax for physical product in taxable state:', {
          zip: shippingPostalCode,
          state: shippingState,
          calculation_id: calculation.id,
          tax_breakdown: calculation.tax_breakdown,
        });
      }

      return NextResponse.json({
        subtotal,
        tax,
        total,
        taxRate,
        using_stripe_tax: true,
        calculation_id: calculation.id,
        tax_breakdown: calculation.tax_breakdown,
      });
    } catch (stripeError: any) {
      // If Stripe Tax calculation fails, fall back to manual calculation
      console.error('❌ Stripe Tax calculation failed:', {
        error: stripeError?.message,
        code: stripeError?.code,
        type: stripeError?.type,
        zip: shippingPostalCode,
        state: shippingState,
      });
      console.log('   Falling back to manual state-level tax calculation');
      
      const { calculateTax } = await import('@/lib/tax-config');
      const { tax, rate } = calculateTax(subtotal, shippingCountry, shippingState, isDigital);
      const total = subtotal + tax;

      console.log('📊 Manual tax calculation result:', {
        subtotal,
        tax,
        total,
        rate: (rate * 100).toFixed(2) + '%',
        state: shippingState,
      });

      return NextResponse.json({
        subtotal,
        tax,
        total,
        taxRate: rate,
        using_stripe_tax: false,
        fallback_reason: stripeError?.message || 'Stripe Tax unavailable',
      });
    }
  } catch (error) {
    console.error('Tax calculation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to calculate tax: ${errorMessage}` },
      { status: 500 }
    );
  }
}

