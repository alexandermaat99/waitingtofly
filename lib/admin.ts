import { createClient } from '@/lib/supabase/server';

// Admin email addresses - in production, this should be stored in the database
const ADMIN_EMAILS = [
  'admin@waitingtofly.com',
  'samly@waitingtofly.com',
  'alexandermaat@gmail.com', // Add your actual email here
  // Add more admin emails as needed
];

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    
    if (error || !data?.claims?.email) {
      return false;
    }
    
    return ADMIN_EMAILS.includes(data.claims.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    
    if (error || !data?.claims?.email) {
      return false;
    }
    
    // Check if user is super admin in database
    const { data: superAdminData, error: superAdminError } = await supabase
      .rpc('is_user_super_admin', { user_email: data.claims.email });
    
    if (superAdminError) {
      console.error('Error checking super admin status:', superAdminError);
      return false;
    }
    
    return superAdminData || false;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

export async function getAdminRole(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    
    if (error || !data?.claims?.email) {
      return 'none';
    }
    
    // Get admin role from database
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_admin_role', { user_email: data.claims.email });
    
    if (roleError) {
      console.error('Error getting admin role:', roleError);
      return 'none';
    }
    
    return roleData || 'none';
  } catch (error) {
    console.error('Error getting admin role:', error);
    return 'none';
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Admin access required');
  }
  return true;
}

export async function requireSuperAdmin() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Super admin access required');
  }
  return true;
}
