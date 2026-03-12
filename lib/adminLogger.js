import { supabase } from './supabase';

/**
 * Log admin action to database
 * @param {string} actionType - The action type (e.g., 'tournament_create', 'user_ban')
 * @param {object} details - Details object to store
 * @param {string} adminId - Admin ID (optional, will auto-detect from session)
 */
export async function logAdminAction(actionType, details = {}, adminId = null) {
  try {
    // Get admin session if not provided
    if (!adminId) {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsed = JSON.parse(session);
        adminId = parsed.id;
      }
    }

    if (!adminId) {
      console.error('❌ No admin ID available for logging');
      return;
    }

    // Insert log with ONLY the columns that exist
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        action_type: actionType,
        details: details,
        admin_id: adminId
        // NO ip_address or user_agent - these columns don't exist
      });

    if (error) {
      console.error('❌ Failed to log admin action:', error);
    } else {
      console.log('✅ Admin action logged:', actionType);
    }
  } catch (error) {
    console.error('❌ Error in logAdminAction:', error);
  }
}
