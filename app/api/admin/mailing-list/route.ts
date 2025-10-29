import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch mailing list subscribers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass admin check
    // await requireAdmin();

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || 'all';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('mailing_list')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (source !== 'all') {
      query = query.eq('source', source);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching mailing list:', error);
      return NextResponse.json({ error: 'Failed to fetch mailing list' }, { status: 500 });
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
    console.error('Mailing list fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update subscriber status or details
export async function PUT(request: NextRequest) {
  try {
    // Temporarily bypass admin check
    // await requireAdmin();

    const supabase = await createClient();

    const { id, status, notes, first_name, last_name }: {
      id: string;
      status?: string;
      notes?: string;
      first_name?: string;
      last_name?: string;
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString();
      } else if (status === 'active') {
        updateData.unsubscribed_at = null;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (first_name !== undefined) {
      updateData.first_name = first_name;
    }

    if (last_name !== undefined) {
      updateData.last_name = last_name;
    }

    const { data, error } = await supabase
      .from('mailing_list')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscriber:', error);
      return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Mailing list update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove subscriber from mailing list
export async function DELETE(request: NextRequest) {
  try {
    // Temporarily bypass admin check
    // await requireAdmin();

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('mailing_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscriber:', error);
      return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscriber deleted successfully' });

  } catch (error) {
    console.error('Mailing list delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
