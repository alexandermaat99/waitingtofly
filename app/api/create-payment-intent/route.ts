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
        ? (physicalFormats.includes('hardcover') ? 'hardcover' : (physicalFormats.includes('paperback') ? 'paperback' : (physicalFormats.includes('bundle') ? 'bundle' : physicalFormats[0])))
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
    // Bundle is a physical product, not digital
    const isDigital = ['ebook', 'audiobook'].includes(bookFormat) && bookFormat !== 'bundle';
    
    // Use subtotal from frontend (price before tax), or fallback to base price from database
    const subtotalAmount = subtotal || bookFormats[bookFormat as keyof typeof bookFormats]?.price || bookFormats?.hardcover?.price || 24.99;
    
    // Get shipping cost (0 for digital products, actual shipping for physical)
    const shippingAmount = isDigital ? 0 : (shipping || 0);
    
    // Amount before tax (subtotal + shipping)
    const amountBeforeTax = subtotalAmount + shippingAmount;

    // Determine product tax code for Stripe Tax
    // 'txcd_99999999' = General tangible personal property (physical books)
    // 'txcd_31000000' = Digital products (ebooks/audiobooks)
    const productTaxCode = isDigital ? 'txcd_31000000' : 'txcd_99999999';
    const bookFormatName = bookFormats[bookFormat]?.name || bookFormat;
    
    // Step 1: Calculate tax using Stripe Tax API
    console.log('📊 Calculating tax with Stripe Tax API:', {
      subtotal: subtotalAmount,
      shipping: shippingAmount,
      amountBeforeTax,
      shippingCountry,
      shippingState,
      shippingCity,
      shippingPostalCode,
      shippingAddressLine1,
      isDigital,
      productTaxCode,
    });
    
    let taxCalculation;
    let finalTaxAmount = 0;
    let finalTotal = amountBeforeTax;
    
    try {
      // Validate required address fields for tax calculation
      // State is REQUIRED for accurate tax calculation in the US
      if (!shippingAddressLine1 || !shippingCity || !shippingPostalCode || !shippingCountry) {
        throw new Error('Missing required address fields for tax calculation');
      }
      
      if (!shippingState || !shippingState.trim()) {
        console.warn('⚠️ WARNING: State is missing - tax calculation may be inaccurate');
      }
      
      // Create line items for tax calculation
      const lineItems = [];
      
      // Add product line item
      lineItems.push({
        amount: formatAmountForStripe(subtotalAmount),
        reference: 'book_preorder',
        tax_code: productTaxCode,
      });
      
      // Add shipping as a separate line item if applicable
      if (shippingAmount > 0) {
        lineItems.push({
          amount: formatAmountForStripe(shippingAmount),
          reference: 'shipping',
          tax_code: 'txcd_99999999', // Shipping is typically taxable
        });
      }
      
      // Prepare address for tax calculation (Stripe requires specific format)
      // State is critical for US tax calculations
      const taxAddress: any = {
        line1: shippingAddressLine1.trim(),
        city: shippingCity.trim(),
        postal_code: shippingPostalCode.trim(),
        country: shippingCountry.trim().toUpperCase() || 'US',
      };
      
      // Add optional fields if present
      if (shippingAddressLine2 && shippingAddressLine2.trim()) {
        taxAddress.line2 = shippingAddressLine2.trim();
      }
      
      // State is required for accurate US tax calculation
      if (shippingState && shippingState.trim()) {
        taxAddress.state = shippingState.trim().toUpperCase();
      } else {
        // Log warning but continue - Stripe might be able to determine state from ZIP
        console.warn('⚠️ State not provided - tax calculation may be less accurate');
      }
      
      console.log('📍 Address being sent to Stripe Tax:', JSON.stringify(taxAddress, null, 2));
      console.log('📦 Line items for tax calculation:', JSON.stringify(lineItems, null, 2));
      console.log('💰 Amounts:', {
        subtotal: subtotalAmount,
        shipping: shippingAmount,
        amountBeforeTax,
        productTaxCode,
        isDigital,
      });
      
      // Create tax calculation using Stripe Tax API
      taxCalculation = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: lineItems,
        customer_details: {
          address: taxAddress,
          address_source: 'shipping',
        },
      });
      
      console.log('✅ Stripe Tax Calculation created:', {
        calculation_id: taxCalculation.id,
        amount_total: taxCalculation.amount_total,
        tax_amount_exclusive: taxCalculation.tax_amount_exclusive,
        tax_amount_inclusive: taxCalculation.tax_amount_inclusive,
        tax_breakdown: taxCalculation.tax_breakdown,
      });
      
      // Log detailed tax breakdown for debugging
      if (taxCalculation.tax_breakdown && taxCalculation.tax_breakdown.length > 0) {
        console.log('🔍 Tax Breakdown Details:');
        taxCalculation.tax_breakdown.forEach((breakdown: any, index: number) => {
          console.log(`  Item ${index + 1}:`, {
            amount: breakdown.amount,
            taxable_amount: breakdown.taxable_amount,
            taxability_reason: breakdown.taxability_reason,
            tax_rate_details: breakdown.tax_rate_details,
          });
        });
      } else {
        console.warn('⚠️ No tax breakdown returned from Stripe Tax');
      }
      
      // Check why tax is not being collected
      if (taxCalculation.tax_amount_exclusive === 0) {
        const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
        console.warn('⚠️ WARNING: Stripe Tax returned $0 tax. Possible reasons:');
        console.warn('  1. Tax registrations may not be set up in Stripe Dashboard');
        if (isTestMode) {
          console.warn('     → In TEST MODE: Go to https://dashboard.stripe.com/test/settings/tax');
          console.warn('     → Add test tax registrations (e.g., California with test reg number)');
          console.warn('     → Use any test registration number like "TEST-123456"');
        } else {
          console.warn('     → In LIVE MODE: Go to https://dashboard.stripe.com/settings/tax');
          console.warn('     → Add your real tax registrations with actual registration numbers');
        }
        console.warn('  2. Business information may not be complete in Stripe Dashboard');
        console.warn('  3. The shipping address might be in a non-taxable jurisdiction');
        console.warn('  4. The product might be tax-exempt in this location');
        console.warn('  5. You may not be registered to collect tax in this jurisdiction');
        console.warn('  Address used:', taxAddress);
        console.warn('  Mode:', isTestMode ? 'TEST' : 'LIVE');
      }
      
      // Extract tax amount (in cents) and convert to dollars
      finalTaxAmount = formatAmountFromStripe(taxCalculation.tax_amount_exclusive || 0);
      // Use amount_total from calculation (includes tax)
      // If amount_total is missing, fallback to calculated total
      const calculatedAmountTotal = taxCalculation.amount_total || formatAmountForStripe(amountBeforeTax + finalTaxAmount);
      finalTotal = formatAmountFromStripe(calculatedAmountTotal);
      
      console.log('💰 Final amounts from Stripe Tax:', {
        subtotal: subtotalAmount,
        shipping: shippingAmount,
        tax: finalTaxAmount,
        total: finalTotal,
        calculation_total: formatAmountFromStripe(taxCalculation.amount_total || 0),
      });
    } catch (taxError: any) {
      console.error('❌ Stripe Tax calculation failed:', {
        error: taxError?.message,
        code: taxError?.code,
        type: taxError?.type,
        statusCode: taxError?.statusCode,
        raw: taxError?.raw,
      });
      console.error('   Full error object:', taxError);
      
      // Log the address that failed
      console.error('   Address used:', {
        line1: shippingAddressLine1,
        city: shippingCity,
        state: shippingState,
        postal_code: shippingPostalCode,
        country: shippingCountry,
      });
      
      // Fallback to manual tax calculation if Stripe Tax fails
      console.log('⚠️ Falling back to manual tax calculation');
      const { tax: calculatedTax } = calculateTax(amountBeforeTax, shippingCountry, shippingState, isDigital);
      finalTaxAmount = calculatedTax;
      finalTotal = amountBeforeTax + finalTaxAmount;
      
      console.log('💰 Final amounts from manual calculation:', {
        subtotal: subtotalAmount,
        shipping: shippingAmount,
        tax: finalTaxAmount,
        total: finalTotal,
      });
    }
    
    // Step 2: Create payment intent with tax calculation linked (if available)
    const paymentIntentData: any = {
      amount: formatAmountForStripe(finalTotal),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Required for PayPal and other redirect-based payment methods
      },
      // Link tax calculation to PaymentIntent if available
      ...(taxCalculation && {
        hooks: {
          inputs: {
            tax: {
              calculation: taxCalculation.id,
            },
          },
        },
      }),
      // Shipping address for Stripe's fraud detection and shipping info
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
        tax_calculation_id: taxCalculation?.id || '',
        email,
        name,
        bookFormat,
        quantity: quantity.toString(),
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
    };
    
    if (taxCalculation) {
      console.log('🔗 Linked tax calculation to PaymentIntent:', taxCalculation.id);
    }
    
    // Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

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
        quantity: quantity || 1,
        amount: finalTotal, // Use total with tax (manual tax calculation)
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
        tax_amount: finalTaxAmount, // Stripe Tax calculation (or fallback to manual)
        tax_rate: subtotalAmount > 0 ? (finalTaxAmount / subtotalAmount) : 0, // Calculate rate from tax
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
      amount: finalTotal, // Return total with tax included
      subtotal: subtotalAmount,
      shipping: shippingAmount,
      tax: finalTaxAmount,
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

