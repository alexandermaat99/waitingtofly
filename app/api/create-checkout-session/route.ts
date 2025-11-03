import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getBookFormats } from '@/lib/site-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      bookFormat,
      quantity = 1,
      shippingFirstName,
      shippingLastName,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry = 'US',
      shippingPhone,
      subtotal,
      shipping = 0,
    } = body;
    
    // Validate bookFormat is provided and not empty
    if (!bookFormat || bookFormat.trim() === '') {
      console.error('Missing bookFormat in request:', body);
      return NextResponse.json(
        { error: 'Book format is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const requiredFields = {
      email,
      name,
      shippingFirstName,
      shippingLastName,
      shippingAddressLine1,
      shippingCity,
      shippingPostalCode
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get book formats from database
    const bookFormats = await getBookFormats();
    
    // Validate bookFormat exists in available formats
    if (!bookFormats || typeof bookFormats !== 'object') {
      console.error('Failed to load book formats from database');
      return NextResponse.json(
        { error: 'Unable to load book formats. Please try again.' },
        { status: 500 }
      );
    }
    
    if (!bookFormats[bookFormat]) {
      const availableFormats = Object.keys(bookFormats);
      return NextResponse.json(
        { error: `Invalid book format "${bookFormat}". Available formats: ${availableFormats.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Determine if product is digital
    const isDigital = ['ebook', 'audiobook'].includes(bookFormat);
    
    // Use subtotal from frontend (price after discount), or fallback to base price from database
    const subtotalAmount = subtotal || bookFormats[bookFormat as keyof typeof bookFormats]?.price || 24.99;
    
    // Get shipping cost (0 for digital products, actual shipping for physical)
    const shippingAmount = isDigital ? 0 : (shipping || 0);
    
    // Amount before tax (subtotal + shipping)
    const amountBeforeTax = subtotalAmount + shippingAmount;
    
    // Determine product tax code for Stripe Tax
    const productTaxCode = isDigital ? 'txcd_31000000' : 'txcd_99999999'; // Digital vs physical
    const bookFormatName = bookFormats[bookFormat]?.name || bookFormat;
    
    // Save order to database BEFORE creating checkout session
    // We'll update it with checkout_session_id and final amounts in the webhook
    const supabase = await createClient();
    
    const orderData: any = {
      email,
      name,
      book_format: bookFormat,
      quantity: quantity || 1,
      amount: amountBeforeTax, // Will be updated in webhook with final tax amount
      status: 'pending',
      book_title: 'Waiting to Fly',
      shipping_first_name: shippingFirstName,
      shipping_last_name: shippingLastName,
      shipping_address_line1: shippingAddressLine1,
      shipping_address_line2: shippingAddressLine2 || null,
      shipping_city: shippingCity,
      shipping_state: shippingState || null,
      shipping_postal_code: shippingPostalCode,
      shipping_country: shippingCountry,
      shipping_phone: shippingPhone || null,
      subtotal: subtotalAmount,
      tax_amount: 0, // Will be updated by Stripe Tax in webhook
      tax_rate: 0, // Will be updated by Stripe Tax in webhook
      // payment_intent_id is not provided for Checkout Sessions
      // It will be set in the webhook when payment completes (if available)
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', orderError);
      console.error('Order data attempted:', JSON.stringify(orderData, null, 2));
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message || 'Database error'}` },
        { status: 500 }
      );
    }
    
    console.log('Order created with ID:', order.id);
    
    // Get the base URL for success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    
    // Create Checkout Session with Stripe Tax enabled
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'payment',
      payment_method_types: ['card'],
      
      // Line items
      // Note: tax_behavior is not supported when using price_data inline
      // Stripe Tax will handle tax behavior automatically when automatic_tax is enabled
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${bookFormatName}${quantity > 1 ? ` (x${quantity})` : ''}`,
              description: quantity > 1 
                ? `${quantity} x ${bookFormatName}`
                : bookFormatName,
              metadata: {
                book_format: bookFormat,
                book_title: 'Waiting to Fly',
              },
              tax_code: productTaxCode,
            },
            unit_amount: formatAmountForStripe(subtotalAmount / quantity), // Price per item
          },
          quantity: quantity,
        },
        // Add shipping as a line item if it's a physical product
        ...(shippingAmount > 0 ? [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
              description: 'Standard shipping',
            },
            unit_amount: formatAmountForStripe(shippingAmount),
          },
          quantity: 1,
        }] : []),
      ],
      
      // Enable automatic tax calculation (Stripe Tax)
      automatic_tax: {
        enabled: true,
      },
      
      // Collect shipping address (required for tax calculation)
      shipping_address_collection: {
        allowed_countries: ['US'], // Add more countries as needed
      },
      
      // Pre-fill shipping address if provided
      // Note: When automatic_tax is enabled, Stripe handles tax behavior automatically
      // tax_behavior in shipping_rate_data is optional and may not be needed
      shipping_options: shippingAmount > 0 ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: formatAmountForStripe(shippingAmount),
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 5,
            },
            maximum: {
              unit: 'business_day',
              value: 10,
            },
          },
          // tax_behavior removed - Stripe Tax handles this automatically when automatic_tax is enabled
        },
      }] : undefined,
      
      // Success and cancel URLs
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?cancelled=true`,
      
      // Metadata to store order information
      metadata: {
        order_id: order.id.toString(),
        book_format: bookFormat,
        quantity: quantity.toString(),
        book_title: 'Waiting to Fly',
      },
      
      // Allow promotion codes
      allow_promotion_codes: true,
    });
    
    console.log('Checkout Session created:', {
      id: session.id,
      url: session.url,
      automatic_tax_enabled: session.automatic_tax?.enabled || false,
    });
    
    // Update order with checkout session ID
    await supabase
      .from('orders')
      .update({ 
        checkout_session_id: session.id,
      })
      .eq('id', order.id);
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url, // This is the redirect URL
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}

