import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, status } = body;

    if (!paymentIntentId || !status) {
      return NextResponse.json(
        { error: 'paymentIntentId and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        ...(status === 'completed' && { payment_completed_at: new Date().toISOString() })
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Failed to update order status:', error);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

