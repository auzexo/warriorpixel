import { supabase } from './supabase';

/**
 * Send admin action to Discord webhook
 */
export async function sendAdminLogToDiscord(action, details, adminId = null, severity = 'info') {
  try {
    // Get Discord webhook URL from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'discord_webhook_logs')
      .single();

    if (!settings?.setting_value) {
      console.log('No Discord webhook configured for logs');
      return;
    }

    const webhookUrl = settings.setting_value;

    // Color based on severity
    const colors = {
      info: 3447003,      // Blue
      success: 3066993,   // Green
      warning: 16776960,  // Yellow
      danger: 15158332,   // Red
      critical: 10038562  // Dark Red
    };

    // Icon based on action type
    const getIcon = (action) => {
      const actionLower = action.toLowerCase();
      if (actionLower.includes('create')) return '✨';
      if (actionLower.includes('delete')) return '🗑️';
      if (actionLower.includes('ban')) return '🚫';
      if (actionLower.includes('unban')) return '✅';
      if (actionLower.includes('update') || actionLower.includes('edit')) return '✏️';
      if (actionLower.includes('distribute') || actionLower.includes('prize')) return '💰';
      if (actionLower.includes('login')) return '🔐';
      return '📝';
    };

    const embed = {
      title: `${getIcon(action)} ${action}`,
      description: details,
      color: colors[severity] || colors.info,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'WarriorPixel Admin Logs'
      }
    };

    // Add admin ID if provided
    if (adminId) {
      embed.fields = [
        {
          name: 'Admin ID',
          value: `\`${adminId.substring(0, 8)}...\``,
          inline: true
        }
      ];
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status);
    } else {
      console.log('✅ Sent to Discord:', action);
    }
  } catch (error) {
    console.error('Discord logger error:', error);
    // Don't throw - logging to Discord shouldn't break the main action
  }
}

/**
 * Log admin action to database AND Discord
 */
export async function logAdminAction(action, details, adminId, options = {}) {
  const {
    targetUserId = null,
    targetTournamentId = null,
    ipAddress = 'N/A',
    userAgent = '',
    sendToDiscord = true,
    severity = 'info'
  } = options;

  try {
    // Log to database
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      details,
      target_user_id: targetUserId,
      target_tournament_id: targetTournamentId,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }

    // Send to Discord if enabled
    if (sendToDiscord) {
      await sendAdminLogToDiscord(action, details, adminId, severity);
    }
  } catch (error) {
    console.error('Error in logAdminAction:', error);
  }
}
