import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        // Retrieve the full session with line items and automatic tax details
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'total_details.breakdown'],
        });
        
        const supabase = await createClient();
        
        // Extract tax information from Stripe Tax
        // Note: total_details structure may vary, so we use type assertions
        const totalDetails = fullSession.total_details as any;
        const taxAmount = totalDetails?.amount_tax ? totalDetails.amount_tax / 100 : 0;
        const subtotalAmount = totalDetails?.amount_subtotal ? totalDetails.amount_subtotal / 100 : 0;
        const totalAmount = fullSession.amount_total ? fullSession.amount_total / 100 : 0;
        
        // Calculate tax rate
        const taxRate = subtotalAmount > 0 ? (taxAmount / subtotalAmount) : 0;
        
        // Update order with checkout session info and Stripe Tax amounts
        const updateData: any = {
          status: 'completed',
          payment_completed_at: new Date().toISOString(),
          subtotal: subtotalAmount,
          tax_amount: taxAmount,
          tax_rate: taxRate,
          amount: totalAmount,
        };
        
        // Add checkout_session_id if not already set
        if (session.id) {
          updateData.checkout_session_id = session.id;
        }
        
        // Add payment_intent_id if available (for backwards compatibility)
        if (session.payment_intent) {
          updateData.payment_intent_id = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id;
        }
        
        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('checkout_session_id', session.id);

        if (error) {
          console.error('Failed to update order:', error);
        } else {
          console.log('✅ Order updated with Stripe Tax amounts:', {
            order_id: session.metadata?.order_id,
            checkout_session_id: session.id,
            subtotal: subtotalAmount,
            tax_amount: taxAmount,
            total: totalAmount,
            tax_rate: `${(taxRate * 100).toFixed(2)}%`,
          });

          // Fetch the complete order details for email
          const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('checkout_session_id', session.id)
            .single();

          if (!orderFetchError && order) {
            // Calculate shipping amount (total - subtotal - tax)
            const calculatedShipping = totalAmount - subtotalAmount - taxAmount;
            
            // Send order confirmation email
            try {
              await sendOrderConfirmationEmail({
                to: order.email,
                customerName: order.name,
                orderId: order.id,
                bookTitle: order.book_title || 'Waiting to Fly',
                bookFormat: order.book_format,
                quantity: order.quantity || 1,
                subtotal: subtotalAmount,
                taxAmount: taxAmount,
                shippingAmount: calculatedShipping,
                totalAmount: totalAmount,
                shippingAddress: {
                  firstName: order.shipping_first_name,
                  lastName: order.shipping_last_name,
                  addressLine1: order.shipping_address_line1,
                  addressLine2: order.shipping_address_line2 || undefined,
                  city: order.shipping_city,
                  state: order.shipping_state || undefined,
                  postalCode: order.shipping_postal_code,
                  country: order.shipping_country || 'US',
                },
                checkoutSessionId: session.id,
              });
            } catch (emailError) {
              // Log email error but don't fail the webhook
              console.error('Failed to send order confirmation email:', emailError);
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        
        const supabase = await createClient();
        
        // Retrieve the full PaymentIntent to get tax information
        // Stripe automatically creates a tax transaction when PaymentIntent succeeds with linked tax calculation
        const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
          expand: ['latest_charge', 'charges'],
        });
        
        // Try to get tax information from metadata or calculate from amount
        // If tax calculation was linked, the amount includes tax
        let taxAmount = 0;
        let subtotalAmount = 0;
        let taxRate = 0;
        
        // First, get the existing order to see what we already have
        const existingOrder = await supabase
          .from('orders')
          .select('subtotal, tax_amount, shipping_price')
          .eq('payment_intent_id', paymentIntent.id)
          .single();
        
        // Check if we have tax_calculation_id in metadata and need to retrieve tax details
        const taxCalculationId = paymentIntent.metadata?.tax_calculation_id;
        
        if (taxCalculationId && existingOrder.data) {
          try {
            // Retrieve the tax calculation to get tax details
            const taxCalculation = await stripe.tax.calculations.retrieve(taxCalculationId);
            taxAmount = (taxCalculation.tax_amount_exclusive || 0) / 100; // Convert from cents
            
            // Use the stored subtotal from the order (product only, doesn't include shipping)
            // The tax calculation includes tax on both product and shipping
            subtotalAmount = existingOrder.data.subtotal || 0;
            taxRate = subtotalAmount > 0 ? (taxAmount / subtotalAmount) : 0;
            
            console.log('✅ Tax information from tax calculation:', {
              calculation_id: taxCalculationId,
              tax_amount: taxAmount,
              subtotal: subtotalAmount,
              tax_rate: `${(taxRate * 100).toFixed(2)}%`,
            });
          } catch (taxError) {
            console.warn('Could not retrieve tax calculation, using stored values:', taxError);
            // Use stored values from order
            if (existingOrder.data) {
              subtotalAmount = existingOrder.data.subtotal || 0;
              taxAmount = existingOrder.data.tax_amount || 0;
              taxRate = subtotalAmount > 0 ? (taxAmount / subtotalAmount) : 0;
            }
          }
        } else if (existingOrder.data) {
          // No tax calculation linked or already have stored values, use what's in the order
          subtotalAmount = existingOrder.data.subtotal || 0;
          taxAmount = existingOrder.data.tax_amount || 0;
          taxRate = subtotalAmount > 0 ? (taxAmount / subtotalAmount) : 0;
        }
        
        const updateData: any = {
          status: 'completed',
          payment_completed_at: new Date().toISOString(),
        };
        
        // Update tax information if we have it
        if (taxAmount > 0 || subtotalAmount > 0) {
          updateData.subtotal = subtotalAmount;
          updateData.tax_amount = taxAmount;
          updateData.tax_rate = taxRate;
          updateData.amount = paymentIntent.amount / 100; // Total amount including tax
        }
        
        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update order:', error);
        } else {
          console.log('✅ Payment Intent succeeded - Order updated:', {
            payment_intent_id: paymentIntent.id,
            subtotal: subtotalAmount,
            tax_amount: taxAmount,
            total: paymentIntent.amount / 100,
            tax_rate: `${(taxRate * 100).toFixed(2)}%`,
          });
        }

        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        const supabase = await createClient();
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            payment_failed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update order:', error);
        }

        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

