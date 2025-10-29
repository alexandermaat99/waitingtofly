import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/admin';

// GET - Fetch all admins
export async function GET(_request: NextRequest) {
  try {
    // Check super admin authentication
    await requireSuperAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admins GET error:', error);
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }
}

// POST - Add new admin
export async function POST(request: NextRequest) {
  try {
    // Check super admin authentication
    await requireSuperAdmin();

    const { email, is_super_admin = false } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if admin already exists
    const { data: existing, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    // Get current user ID for created_by
    const { data: currentUser } = await supabase.auth.getClaims();
    const currentUserId = currentUser?.claims?.sub;

    // Create new admin
    const { data, error } = await supabase
      .from('admins')
      .insert({
        email,
        is_super_admin,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json(
        { error: 'Failed to create admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin created successfully',
      data
    });
  } catch (error) {
    console.error('Admins POST error:', error);
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }
}

// PATCH - Update admin
export async function PATCH(request: NextRequest) {
  try {
    // Check super admin authentication
    await requireSuperAdmin();

    const { id, is_active, is_super_admin } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (typeof is_super_admin === 'boolean') updateData.is_super_admin = is_super_admin;

    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin:', error);
      return NextResponse.json(
        { error: 'Failed to update admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin updated successfully',
      data
    });
  } catch (error) {
    console.error('Admins PATCH error:', error);
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  try {
    // Check super admin authentication
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if trying to delete a super admin
    const { data: admin, error: checkError } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking admin:', checkError);
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    if (admin.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot delete super admin' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin:', error);
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Admins DELETE error:', error);
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }
}
