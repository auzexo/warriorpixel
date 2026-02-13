import { supabase } from './supabase';

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export const verifyAdminCredentials = async (adminId, adminPassword) => {
  try {
    const { data, error } = await supabase.rpc('verify_admin_credentials', {
      p_admin_id: adminId,
      p_admin_password: adminPassword,
    });

    if (error) throw error;

    if (data && data.length > 0 && data[0].is_valid) {
      // Update last login
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data[0].admin_account_id);

      return {
        success: true,
        adminAccount: data[0],
      };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { success: false, error: error.message };
  }
};

export const verifySuperAdminCredentials = async (superAdminId, superAdminPassword) => {
  try {
    const { data, error } = await supabase
      .from('super_admin_whitelist')
      .select('*')
      .eq('super_admin_id', superAdminId)
      .eq('super_admin_password', superAdminPassword)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid super admin credentials' };
  }
};

// ==========================================
// PERMISSION CHECKING
// ==========================================

export const hasPermission = (permissions, requiredPermission) => {
  if (!permissions) return false;
  
  const permArray = Array.isArray(permissions) ? permissions : permissions;
  
  // Full access grants everything
  if (permArray.includes('full_access')) return true;
  
  // Check specific permission
  return permArray.includes(requiredPermission);
};

export const PERMISSIONS = {
  FULL_ACCESS: 'full_access',
  TOURNAMENT_CREATE: 'tournament_create',
  TOURNAMENT_EDIT: 'tournament_edit',
  TOURNAMENT_DELETE: 'tournament_delete',
  TOURNAMENT_MANAGE_PARTICIPANTS: 'tournament_manage_participants',
  USER_VIEW: 'user_view',
  USER_EDIT_CURRENCY: 'user_edit_currency',
  USER_BAN: 'user_ban',
  USER_SUSPEND: 'user_suspend',
  USER_GIVE_REWARDS: 'user_give_rewards',
  ANNOUNCEMENT_CREATE: 'announcement_create',
  LOGS_VIEW: 'logs_view',
};

// ==========================================
// ADMIN LOGGING
// ==========================================

export const logAdminAction = async (adminId, actionType, details = {}) => {
  try {
    const { data, error } = await supabase.rpc('log_admin_action', {
      p_admin_id: adminId,
      p_action_type: actionType,
      p_target_user_id: details.targetUserId || null,
      p_target_tournament_id: details.targetTournamentId || null,
      p_details: details,
    });

    if (error) throw error;
    return { success: true, logId: data };
  } catch (error) {
    console.error('Error logging admin action:', error);
    return { success: false, error: error.message };
  }
};
