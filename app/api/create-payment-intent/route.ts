import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getBookFormats } from '@/lib/site-config';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      name, 
      bookFormat = 'hardcover',
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
      tax,
      total
    } = await request.json();

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
    
    // Use the calculated total from the frontend, or fallback to base price from database
    const amount = total || bookFormats?.[bookFormat as keyof typeof bookFormats]?.price || bookFormats?.hardcover?.price || 24.99;

    // Create payment intent with shipping information
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata: {
        email,
        name,
        bookFormat,
        bookTitle: 'Waiting to Fly',
        shippingFirstName,
        shippingLastName,
        shippingAddressLine1,
        shippingAddressLine2: shippingAddressLine2 || '',
        shippingCity,
        shippingState: shippingState || '',
        shippingPostalCode,
        shippingCountry,
        shippingPhone: shippingPhone || '',
      },
    });

    // Save order to database with shipping information
    const supabase = await createClient();
    const { error } = await supabase
      .from('orders')
      .insert({
        email,
        name,
        book_format: bookFormat,
        amount: amount,
        payment_intent_id: paymentIntent.id,
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
        subtotal: subtotal || amount,
        tax_amount: tax || 0,
        tax_rate: tax && subtotal ? (tax / subtotal) : 0,
      });

    if (error) {
      console.error('Database error:', error);
      // Continue with payment even if database save fails
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create payment intent: ${errorMessage}` },
      { status: 500 }
    );
  }
}

