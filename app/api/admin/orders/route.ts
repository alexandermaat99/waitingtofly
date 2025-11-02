import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass admin check
    // await requireAdmin();

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const shippingStatus = searchParams.get('shipping_status') || 'all';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (shippingStatus !== 'all') {
      query = query.eq('shipping_status', shippingStatus);
    }

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,name.ilike.%${search}%,payment_intent_id.ilike.%${search}%,tracking_number.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update order status or shipping information
export async function PUT(request: NextRequest) {
  try {
    // Temporarily bypass admin check
    // await requireAdmin();

    const supabase = await createClient();

    const {
      id,
      status,
      shipping_status,
      tracking_number
    }: {
      id: string;
      status?: string;
      shipping_status?: string;
      tracking_number?: string;
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.payment_completed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.payment_failed_at = new Date().toISOString();
      }
    }

    if (shipping_status !== undefined) {
      updateData.shipping_status = shipping_status;
      if (shipping_status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (shipping_status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

