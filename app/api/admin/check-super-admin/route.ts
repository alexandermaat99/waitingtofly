import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin';

export async function GET(_request: NextRequest) {
  try {
    const superAdmin = await isSuperAdmin();
    
    return NextResponse.json({
      is_super_admin: superAdmin
    });
  } catch (error) {
    console.error('Check super admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
