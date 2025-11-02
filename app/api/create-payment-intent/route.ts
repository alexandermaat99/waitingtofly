import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe, formatAmountFromStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getBookFormats } from '@/lib/site-config';
import { calculateTax } from '@/lib/tax-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      bookFormat,
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
    } = body;
    
    // Validate bookFormat is provided and not empty
    if (!bookFormat || bookFormat.trim() === '') {
      console.error('Missing bookFormat in request:', body);
      return NextResponse.json(
        { error: 'Book format is required' },
        { status: 400 }
      );
    }
    
    console.log('Received bookFormat:', bookFormat, 'from request body');

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
    
    // CRITICAL: Validate bookFormat exists in available formats from database
    if (!bookFormats || typeof bookFormats !== 'object') {
      console.error('Failed to load book formats from database');
      return NextResponse.json(
        { error: 'Unable to load book formats. Please try again.' },
        { status: 500 }
      );
    }
    
    const availableFormats = Object.keys(bookFormats);
    console.log('=== API FORMAT VALIDATION ===');
    console.log('Available formats from database:', availableFormats);
    console.log('Full bookFormats object:', JSON.stringify(bookFormats, null, 2));
    console.log('Received bookFormat from frontend:', bookFormat);
    console.log('Type of bookFormat:', typeof bookFormat);
    console.log('Trimmed bookFormat:', bookFormat?.trim());
    
    // Validate the format exists in database - reject if invalid
    if (!bookFormats[bookFormat]) {
      console.error('❌ INVALID FORMAT REJECTED:', bookFormat);
      console.error('Available formats:', availableFormats);
      console.error('Checking if format exists:', {
        'direct key check': bookFormats[bookFormat],
        'hasOwnProperty': Object.prototype.hasOwnProperty.call(bookFormats, bookFormat),
        'in operator': bookFormat in bookFormats
      });
      
      // Try to get a valid fallback format
      const physicalFormats = availableFormats.filter(key => !['ebook', 'audiobook'].includes(key));
      const fallbackFormat = physicalFormats.length > 0 
        ? (physicalFormats.includes('hardcover') ? 'hardcover' : (physicalFormats.includes('paperback') ? 'paperback' : physicalFormats[0]))
        : availableFormats[0];
      
      console.error('Rejecting invalid format. Valid formats are:', availableFormats);
      console.error('Suggested fallback:', fallbackFormat);
      
      return NextResponse.json(
        { error: `Invalid book format "${bookFormat}". Available formats: ${availableFormats.join(', ')}` },
        { status: 400 }
      );
    }
    
    console.log('✅ Format validation PASSED:', bookFormat);
    
    // Determine if product is digital (for Stripe Tax product tax code)
    const isDigital = ['ebook', 'audiobook'].includes(bookFormat);
    
    // Use subtotal from frontend (price before tax), or fallback to base price from database
    const subtotalAmount = subtotal || bookFormats[bookFormat as keyof typeof bookFormats]?.price || bookFormats?.hardcover?.price || 24.99;

    // Determine product tax code for Stripe Tax
    // 'txcd_99999999' = General tangible personal property (physical books)
    // 'txcd_31000000' = Digital products (ebooks/audiobooks)
    const productTaxCode = isDigital ? 'txcd_31000000' : 'txcd_99999999';
    const bookFormatName = bookFormats[bookFormat]?.name || bookFormat;
    
    // Create payment intent with Stripe Tax enabled (if available)
    // Note: Stripe Tax must be enabled in Dashboard first
    // If Stripe Tax isn't enabled, this will fall back to manual tax calculation
    const paymentIntentParams: any = {
      amount: formatAmountForStripe(subtotalAmount),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Required for PayPal and other redirect-based payment methods
      },
    };
    
    // Add automatic_tax parameter - will be ignored if Stripe Tax isn't enabled in Dashboard
    // We'll catch any errors and fall back to manual calculation
    paymentIntentParams.automatic_tax = {
      enabled: true,
    };
    
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        ...paymentIntentParams,
      // Shipping address for tax calculation (required when using Stripe Tax)
      // Also useful for Stripe's fraud detection and shipping info
      shipping: {
        name: `${shippingFirstName} ${shippingLastName}`,
        address: {
          line1: shippingAddressLine1,
          line2: shippingAddressLine2 || undefined,
          city: shippingCity,
          state: shippingState || undefined,
          postal_code: shippingPostalCode,
          country: shippingCountry,
        },
        phone: shippingPhone || undefined,
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
        product_tax_code: productTaxCode, // Stored for reference
        is_digital: isDigital.toString(),
      },
      });
    } catch (stripeError: any) {
      // If automatic_tax parameter is not recognized, remove it and retry
      if (stripeError.message?.includes('automatic_tax') || stripeError.code === 'parameter_unknown') {
        console.log('⚠️ Stripe Tax not available (not enabled in Dashboard), using manual tax calculation');
        // Remove automatic_tax and retry without it
        delete paymentIntentParams.automatic_tax;
        paymentIntent = await stripe.paymentIntents.create({
          ...paymentIntentParams,
          shipping: {
            name: `${shippingFirstName} ${shippingLastName}`,
            address: {
              line1: shippingAddressLine1,
              line2: shippingAddressLine2 || undefined,
              city: shippingCity,
              state: shippingState || undefined,
              postal_code: shippingPostalCode,
              country: shippingCountry,
            },
            phone: shippingPhone || undefined,
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
            product_tax_code: productTaxCode,
            is_digital: isDigital.toString(),
          },
        });
      } else {
        // Some other error, re-throw it
        throw stripeError;
      }
    }
    
    // Get Stripe Tax calculated amount (Stripe Tax is now enabled!)
    let stripeTaxAmount = 0;
    let stripeTotal = subtotalAmount;
    let usingStripeTax = false;
    
    // Check if payment intent was created with automatic_tax enabled
    // Type assertion needed because automatic_tax may not be in type definition yet
    const paymentIntentWithTax = paymentIntent as any;
    if (paymentIntentWithTax.automatic_tax?.enabled) {
      try {
        // Retrieve payment intent to get Stripe Tax calculation
        // Stripe Tax calculates asynchronously, so we retrieve it after creation
        const retrievedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
          expand: ['automatic_tax.calculation'],
        });
        
        // Type assertion needed because automatic_tax may not be in type definition yet
        const retrievedPaymentIntentWithTax = retrievedPaymentIntent as any;
        const automaticTax = retrievedPaymentIntentWithTax.automatic_tax;
        
        if (automaticTax && automaticTax.status === 'complete' && automaticTax.amount !== null && automaticTax.amount !== undefined) {
          // ✅ Stripe Tax successfully calculated tax!
          stripeTaxAmount = formatAmountFromStripe(automaticTax.amount);
          stripeTotal = subtotalAmount + stripeTaxAmount;
          usingStripeTax = true;
          
          console.log('✅ Stripe Tax Calculation SUCCESS:', {
            subtotal: subtotalAmount,
            tax_calculated_by_stripe: stripeTaxAmount,
            total_with_tax: stripeTotal,
            tax_rate_percentage: stripeTaxAmount > 0 ? ((stripeTaxAmount / subtotalAmount) * 100).toFixed(2) + '%' : '0%',
            shipping_location: `${shippingCity}, ${shippingState} ${shippingPostalCode}`,
            tax_status: automaticTax.status,
          });
        } else {
          // Stripe Tax is enabled but calculation not complete or failed
          console.log('⚠️ Stripe Tax enabled but calculation incomplete. Status:', automaticTax?.status);
          console.log('   Falling back to manual tax calculation');
          const { tax: manualTax } = calculateTax(subtotalAmount, shippingCountry, shippingState, isDigital);
          stripeTaxAmount = manualTax;
          stripeTotal = subtotalAmount + manualTax;
        }
      } catch (taxError: any) {
        // Error retrieving tax info, fall back to manual calculation
        console.log('⚠️ Error retrieving Stripe Tax calculation:', taxError?.message);
        console.log('   Falling back to manual tax calculation');
        const { tax: manualTax } = calculateTax(subtotalAmount, shippingCountry, shippingState, isDigital);
        stripeTaxAmount = manualTax;
        stripeTotal = subtotalAmount + manualTax;
      }
    } else {
      // automatic_tax was not enabled on payment intent (removed in fallback), use manual calculation
      console.log('ℹ️ Using manual tax calculation (Stripe Tax not enabled on payment intent)');
      const { tax: manualTax } = calculateTax(subtotalAmount, shippingCountry, shippingState, isDigital);
      stripeTaxAmount = manualTax;
      stripeTotal = subtotalAmount + manualTax;
    }

    // Save order to database with shipping information
    // FINAL SAFETY CHECK: Ensure format is valid before saving
    if (!bookFormats[bookFormat]) {
      console.error('CRITICAL: Attempted to save invalid format to database:', bookFormat);
      console.error('Available formats:', Object.keys(bookFormats));
      return NextResponse.json(
        { error: `Cannot save order: Invalid book format "${bookFormat}"` },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const orderData = {
        email,
        name,
        book_format: bookFormat, // Format has been validated above
        amount: stripeTotal, // Use total with tax (Stripe Tax will handle actual collection)
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
        subtotal: subtotalAmount,
        tax_amount: stripeTaxAmount, // Use Stripe Tax calculated amount
        tax_rate: stripeTaxAmount / subtotalAmount, // Calculate rate from Stripe Tax
    };
    
    console.log('Inserting order with book_format:', orderData.book_format);
    
    const { error } = await supabase
      .from('orders')
      .insert(orderData);

    if (error) {
      console.error('Database error:', error);
      console.error('Order data that failed:', orderData);
      // Continue with payment even if database save fails
    } else {
      console.log('Order successfully created with book_format:', orderData.book_format);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: stripeTotal, // Return total with tax included
      subtotal: subtotalAmount,
      tax: stripeTaxAmount,
      using_stripe_tax: usingStripeTax, // Indicate if Stripe Tax was used
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

