import { supabase } from './supabase';

// Permission constants
export const PERMISSIONS = {
  FULL_ACCESS: 'full_access',
  
  // Tournament permissions
  TOURNAMENT_CREATE: 'tournament_create',
  TOURNAMENT_EDIT: 'tournament_edit',
  TOURNAMENT_DELETE: 'tournament_delete',
  TOURNAMENT_MANAGE_PARTICIPANTS: 'tournament_manage_participants',
  
  // User permissions
  USER_VIEW: 'user_view',
  USER_EDIT_CURRENCY: 'user_edit_currency',
  USER_BAN: 'user_ban',
  USER_SUSPEND: 'user_suspend',
  USER_GIVE_REWARDS: 'user_give_rewards',
  
  // Announcement permissions
  ANNOUNCEMENT_CREATE: 'announcement_create',
  
  // Logs permissions
  LOGS_VIEW: 'logs_view',
};

// Verify admin credentials
export async function verifyAdminCredentials(adminId, password) {
  try {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('admin_id', adminId)
      .eq('admin_password', password)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    await supabase
      .from('admin_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    return {
      success: true,
      admin: data,
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { success: false, error: error.message };
  }
}

// Verify super admin credentials
export async function verifySuperAdminCredentials(superAdminId, superAdminPassword) {
  try {
    const { data, error } = await supabase
      .from('super_admin_whitelist')
      .select('*')
      .eq('super_admin_id', superAdminId)
      .eq('super_admin_password', superAdminPassword)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid super admin credentials' };
    }

    return {
      success: true,
      superAdmin: data,
    };
  } catch (error) {
    console.error('Super admin verification error:', error);
    return { success: false, error: error.message };
  }
}

// Check if user has permission
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  // Full access grants all permissions
  if (userPermissions.includes(PERMISSIONS.FULL_ACCESS)) {
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
}

// Log admin action
export async function logAdminAction(adminAccountId, actionType, details = {}) {
  try {
    console.log('Logging admin action:', { adminAccountId, actionType, details });

    const logData = {
      admin_id: adminAccountId,
      action_type: actionType,
      details: details,
      target_user_id: details.targetUserId || null,
      target_tournament_id: details.targetTournamentId || null,
    };

    const { data, error } = await supabase
      .from('admin_logs')
      .insert([logData])
      .select();

    if (error) {
      console.error('Error logging admin action:', error);
      return { success: false, error };
    }

    console.log('Admin action logged successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Log admin action error:', error);
    return { success: false, error };
  }
                  }
