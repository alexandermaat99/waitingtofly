import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Update order status in database
        const supabase = await createClient();
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            payment_completed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update order:', error);
        }

        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Update order status to failed
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

