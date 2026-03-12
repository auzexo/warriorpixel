import { supabase } from './supabase';

export async function logAdminAction(action, details, adminId = null) {
  try {
    // Get admin session if not provided
    if (!adminId) {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsed = JSON.parse(session);
        adminId = parsed.id;
      }
    }

    const { error } = await supabase
      .from('admin_logs')
      .insert({
        action_type: action, // Using action_type to match old logs
        details: details,
        admin_id: adminId,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      });

    if (error) {
      console.error('Failed to log admin action:', error);
    } else {
      console.log('✅ Logged:', action);
    }
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}
