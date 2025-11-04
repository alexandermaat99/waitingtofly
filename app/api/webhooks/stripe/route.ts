import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '@/lib/email';

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
        
        // Try multiple ways to find the order
        let order = null;
        let orderFetchError = null;
        
        // First, try to find by checkout_session_id (most reliable)
        let { data: foundOrder, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('checkout_session_id', session.id)
          .single();

        if (!fetchError && foundOrder) {
          order = foundOrder;
          console.log('✅ Found order by checkout_session_id:', order.id);
        } else {
          // If not found, try by order_id from metadata
          if (session.metadata?.order_id) {
            console.log('⚠️ Order not found by checkout_session_id, trying order_id from metadata:', session.metadata.order_id);
            const { data: foundOrderByMetadata, error: metadataError } = await supabase
              .from('orders')
              .select('*')
              .eq('id', session.metadata.order_id)
              .single();
            
            if (!metadataError && foundOrderByMetadata) {
              order = foundOrderByMetadata;
              console.log('✅ Found order by order_id from metadata:', order.id);
            } else {
              console.error('❌ Failed to find order by order_id:', metadataError);
              orderFetchError = metadataError;
            }
          } else {
            // Last resort: try by payment_intent_id
            if (session.payment_intent) {
              const paymentIntentId = typeof session.payment_intent === 'string' 
                ? session.payment_intent 
                : session.payment_intent.id;
              
              console.log('⚠️ Order not found by checkout_session_id, trying payment_intent_id:', paymentIntentId);
              const { data: foundOrderByPaymentIntent, error: paymentIntentError } = await supabase
                .from('orders')
                .select('*')
                .eq('payment_intent_id', paymentIntentId)
                .single();
              
              if (!paymentIntentError && foundOrderByPaymentIntent) {
                order = foundOrderByPaymentIntent;
                console.log('✅ Found order by payment_intent_id:', order.id);
              } else {
                console.error('❌ Failed to find order by payment_intent_id:', paymentIntentError);
                orderFetchError = paymentIntentError;
              }
            } else {
              console.error('❌ Failed to find order - no checkout_session_id match and no order_id in metadata');
              orderFetchError = fetchError;
            }
          }
        }

        // Update the order if we found it
        if (order) {
          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

          if (updateError) {
            console.error('❌ Failed to update order:', updateError);
          } else {
            console.log('✅ Order updated with Stripe Tax amounts:', {
              order_id: order.id,
              checkout_session_id: session.id,
              subtotal: subtotalAmount,
              tax_amount: taxAmount,
              total: totalAmount,
              tax_rate: `${(taxRate * 100).toFixed(2)}%`,
            });
          }
        } else {
          console.error('❌ Cannot update order - order not found. Session ID:', session.id, 'Metadata:', session.metadata);
        }

        // Send emails - use order data if available, otherwise fallback to Stripe session data
        if (order) {
          // Calculate shipping amount (total - subtotal - tax)
          const calculatedShipping = totalAmount - subtotalAmount - taxAmount;
          
          // Prepare order email data
          const orderEmailData = {
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
          };

          // Send order confirmation email to customer
          console.log('📧 Attempting to send customer confirmation email to:', orderEmailData.to);
          try {
            const customerEmailResult = await sendOrderConfirmationEmail(orderEmailData);
            if (customerEmailResult.success) {
              console.log('✅ Customer confirmation email sent successfully');
            } else {
              console.error('❌ Customer confirmation email failed:', customerEmailResult.error);
            }
          } catch (emailError) {
            // Log email error but don't fail the webhook
            console.error('❌ Exception sending customer confirmation email:', emailError);
          }

          // Send admin notification email
          console.log('📧 Attempting to send admin notification email');
          try {
            const adminEmailResult = await sendAdminOrderNotificationEmail(orderEmailData);
            if (adminEmailResult.success) {
              console.log('✅ Admin notification email sent successfully');
            } else {
              console.error('❌ Admin notification email failed:', adminEmailResult.error);
            }
          } catch (adminEmailError) {
            // Log admin email error but don't fail the webhook
            console.error('❌ Exception sending admin notification email:', adminEmailError);
          }
        } else {
          // Fallback: Try to send emails using Stripe session data directly
          console.log('⚠️ Order not found in database, attempting to send emails using Stripe session data');
          const customerEmail = session.customer_email || session.customer_details?.email;
          const customerName = session.customer_details?.name || 'Customer';
          const shippingDetails = session.shipping_details;
          
          if (customerEmail) {
            // Try to extract order info from metadata
            const bookFormat = session.metadata?.book_format || 'Unknown';
            const quantity = parseInt(session.metadata?.quantity || '1', 10);
            const bookTitle = session.metadata?.book_title || 'Waiting to Fly';
            const orderIdFromMetadata = session.metadata?.order_id || session.id;
            
            // Extract shipping address from Stripe session
            const shippingAddress = shippingDetails?.address 
              ? {
                  firstName: shippingDetails.name?.split(' ')[0] || customerName.split(' ')[0] || '',
                  lastName: shippingDetails.name?.split(' ').slice(1).join(' ') || customerName.split(' ').slice(1).join(' ') || '',
                  addressLine1: shippingDetails.address.line1 || '',
                  addressLine2: shippingDetails.address.line2 || undefined,
                  city: shippingDetails.address.city || '',
                  state: shippingDetails.address.state || undefined,
                  postalCode: shippingDetails.address.postal_code || '',
                  country: shippingDetails.address.country || 'US',
                }
              : {
                  firstName: customerName.split(' ')[0] || '',
                  lastName: customerName.split(' ').slice(1).join(' ') || '',
                  addressLine1: 'Address not available',
                  addressLine2: undefined,
                  city: '',
                  state: undefined,
                  postalCode: '',
                  country: 'US',
                };
            
            const orderEmailData = {
              to: customerEmail,
              customerName: customerName,
              orderId: orderIdFromMetadata,
              bookTitle: bookTitle,
              bookFormat: bookFormat,
              quantity: quantity,
              subtotal: subtotalAmount,
              taxAmount: taxAmount,
              shippingAmount: totalAmount - subtotalAmount - taxAmount,
              totalAmount: totalAmount,
              shippingAddress: shippingAddress,
              checkoutSessionId: session.id,
            };

            // Send order confirmation email to customer
            console.log('📧 Attempting to send customer confirmation email using Stripe session data to:', customerEmail);
            try {
              const customerEmailResult = await sendOrderConfirmationEmail(orderEmailData);
              if (customerEmailResult.success) {
                console.log('✅ Customer confirmation email sent successfully (using Stripe session data)');
              } else {
                console.error('❌ Customer confirmation email failed:', customerEmailResult.error);
              }
            } catch (emailError) {
              console.error('❌ Exception sending customer confirmation email:', emailError);
            }

            // Send admin notification email
            console.log('📧 Attempting to send admin notification email using Stripe session data');
            try {
              const adminEmailResult = await sendAdminOrderNotificationEmail(orderEmailData);
              if (adminEmailResult.success) {
                console.log('✅ Admin notification email sent successfully (using Stripe session data)');
              } else {
                console.error('❌ Admin notification email failed:', adminEmailResult.error);
              }
            } catch (adminEmailError) {
              console.error('❌ Exception sending admin notification email:', adminEmailError);
            }
          } else {
            console.error('❌ Cannot send emails - no customer email available in Stripe session. Session ID:', session.id);
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
        
        // Get the full order record first - it has all the correct values
        // The order was saved with subtotal, tax_amount, and amount when created
        let order = null;
        const { data: foundOrder, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_intent_id', paymentIntent.id)
          .single();

        if (!fetchError && foundOrder) {
          order = foundOrder;
          console.log('✅ Found order by payment_intent_id:', order.id);
        } else {
          console.error('❌ Failed to find order by payment_intent_id:', fetchError);
        }

        // Use values from the order record - these are the source of truth
        // The order was saved with correct subtotal and tax_amount when created
        let taxAmount = 0;
        let subtotalAmount = 0;
        let taxRate = 0;
        let totalAmount = paymentIntent.amount / 100;
        
        if (order) {
          // Use the values stored in the order (they were calculated correctly when order was created)
          subtotalAmount = order.subtotal || 0;
          taxAmount = order.tax_amount || 0;
          taxRate = order.tax_rate || 0;
          totalAmount = order.amount || totalAmount; // Use order amount if available, otherwise use payment intent amount
          
          console.log('✅ Using values from order record:', {
            subtotal: subtotalAmount,
            tax_amount: taxAmount,
            tax_rate: `${(taxRate * 100).toFixed(2)}%`,
            total: totalAmount,
          });
        } else {
          // Fallback: Try to get from payment intent metadata or calculate
          // Check if we have tax_calculation_id in metadata
          const taxCalculationId = paymentIntent.metadata?.tax_calculation_id;
          
          if (taxCalculationId) {
            try {
              const taxCalculation = await stripe.tax.calculations.retrieve(taxCalculationId);
              taxAmount = (taxCalculation.tax_amount_exclusive || 0) / 100;
              
              // Try to get subtotal from metadata or calculate from total
              subtotalAmount = totalAmount - taxAmount; // Rough estimate
              taxRate = subtotalAmount > 0 ? (taxAmount / subtotalAmount) : 0;
              
              console.log('⚠️ Using tax calculation fallback:', {
                calculation_id: taxCalculationId,
                tax_amount: taxAmount,
                subtotal: subtotalAmount,
              });
            } catch (taxError) {
              console.warn('Could not retrieve tax calculation:', taxError);
            }
          }
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
        
        // Order was already fetched above to get tax/subtotal values

        // Update the order if we found it
        if (order) {
          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

          if (updateError) {
            console.error('❌ Failed to update order:', updateError);
          } else {
            console.log('✅ Payment Intent succeeded - Order updated:', {
              order_id: order.id,
              payment_intent_id: paymentIntent.id,
              subtotal: subtotalAmount,
              tax_amount: taxAmount,
              total: paymentIntent.amount / 100,
              tax_rate: `${(taxRate * 100).toFixed(2)}%`,
            });
          }
        } else {
          console.error('❌ Cannot update order - order not found. Payment Intent ID:', paymentIntent.id);
        }

        // Send emails if we have the order data
        if (order) {
          // Shipping should be 0 if it wasn't charged
          // Calculate shipping as: total - subtotal - tax
          // But if subtotal + tax already equals total, shipping is 0
          const calculatedShipping = Math.max(0, totalAmount - subtotalAmount - taxAmount);
          
          // For test format or digital products, shipping should always be 0
          const isDigital = ['ebook', 'audiobook'].includes(order.book_format);
          const shippingAmount = (isDigital || calculatedShipping < 0.01) ? 0 : calculatedShipping;
          
          console.log('📦 Shipping calculation:', {
            calculatedShipping,
            isDigital,
            bookFormat: order.book_format,
            finalShippingAmount: shippingAmount,
          });
          
          // Prepare order email data
          const orderEmailData = {
            to: order.email,
            customerName: order.name,
            orderId: order.id,
            bookTitle: order.book_title || 'Waiting to Fly',
            bookFormat: order.book_format,
            quantity: order.quantity || 1,
            subtotal: subtotalAmount,
            taxAmount: taxAmount,
            shippingAmount: shippingAmount,
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
            checkoutSessionId: order.checkout_session_id || undefined,
          };

          // Send order confirmation email to customer
          console.log('📧 Attempting to send customer confirmation email to:', orderEmailData.to);
          try {
            const customerEmailResult = await sendOrderConfirmationEmail(orderEmailData);
            if (customerEmailResult.success) {
              console.log('✅ Customer confirmation email sent successfully');
            } else {
              console.error('❌ Customer confirmation email failed:', customerEmailResult.error);
            }
          } catch (emailError) {
            console.error('❌ Exception sending customer confirmation email:', emailError);
          }

          // Send admin notification email
          console.log('📧 Attempting to send admin notification email');
          try {
            const adminEmailResult = await sendAdminOrderNotificationEmail(orderEmailData);
            if (adminEmailResult.success) {
              console.log('✅ Admin notification email sent successfully');
            } else {
              console.error('❌ Admin notification email failed:', adminEmailResult.error);
            }
          } catch (adminEmailError) {
            console.error('❌ Exception sending admin notification email:', adminEmailError);
          }
        } else {
          console.error('❌ Cannot send emails - order data not available. Payment Intent ID:', paymentIntent.id);
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

