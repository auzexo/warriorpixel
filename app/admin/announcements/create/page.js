'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave, FaBullhorn, FaBell, FaDiscord } from 'react-icons/fa';

export default function CreateAnnouncementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 50,
    is_active: true,
    show_on_homepage: true,
    show_on_dashboard: false,
    expires_at: '',
    link_url: '',
    link_text: '',
    send_notifications: false,
    send_discord: false
  });

  useEffect(() => {
    loadDiscordWebhook();
  }, []);

  const loadDiscordWebhook = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_webhook_url')
        .single();
      
      if (data?.setting_value) {
        setDiscordWebhook(data.setting_value);
      }
    } catch (error) {
      console.error('Error loading Discord webhook:', error);
    }
  };

  const sendToDiscord = async (title, message, type) => {
    if (!discordWebhook) {
      console.log('No Discord webhook configured');
      return;
    }

    try {
      const colorMap = {
        info: 3447003,      // Blue
        success: 3066993,   // Green
        warning: 16776960,  // Yellow
        error: 15158332,    // Red
        tournament: 10181046, // Purple
        maintenance: 9807270  // Gray
      };

      const embed = {
        title: `📢 ${title}`,
        description: message,
        color: colorMap[type] || colorMap.info,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'WarriorPixel Announcement'
        }
      };

      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) {
        throw new Error('Discord webhook failed');
      }

      console.log('✅ Sent to Discord');
    } catch (error) {
      console.error('Discord webhook error:', error);
      alert('Warning: Failed to send to Discord. Announcement created but not posted to Discord.');
    }
  };

  const sendNotificationsToUsers = async (title, message) => {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        console.log('No users to notify');
        return;
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.id,
        title: `📢 ${title}`,
        message: message,
        type: 'announcement',
        read: false
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      console.log(`✅ Sent notifications to ${users.length} users`);
    } catch (error) {
      console.error('Notifications error:', error);
      alert('Warning: Failed to send notifications. Announcement created but users were not notified.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Title and message are required!');
      return;
    }

    setSaving(true);

    try {
      const insertData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        is_active: formData.is_active,
        show_on_homepage: formData.show_on_homepage,
        show_on_dashboard: formData.show_on_dashboard,
        created_by: user.id,
        expires_at: formData.expires_at || null,
        link_url: formData.link_url || null,
        link_text: formData.link_text || null
      };

      const { error } = await supabase
        .from('announcements')
        .insert(insertData);

      if (error) throw error;

      // Send to Discord if enabled
      if (formData.send_discord && discordWebhook) {
        await sendToDiscord(formData.title, formData.message, formData.type);
      }

      // Send notifications if enabled
      if (formData.send_notifications) {
        await sendNotificationsToUsers(formData.title, formData.message);
      }

      alert('✅ Announcement created successfully!');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error creating announcement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/announcements')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-colors"
        >
          <FaArrowLeft /> Back to Announcements
        </button>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
          <FaBullhorn className="text-purple-400" />
          Create Announcement
        </h1>
        <p className="text-discord-text">Post a new announcement to users</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Announcement title"
              className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Announcement message"
              rows={4}
              className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              >
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="error">❌ Error</option>
                <option value="tournament">🏆 Tournament</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Priority (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
              <p className="text-xs text-discord-text mt-1">Higher priority = shown first</p>
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
              className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
            />
            <p className="text-xs text-discord-text mt-1">Leave empty for no expiration</p>
          </div>

          {/* Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Link URL (Optional)
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Link Text (Optional)
              </label>
              <input
                type="text"
                value={formData.link_text}
                onChange={(e) => setFormData({...formData, link_text: e.target.value})}
                placeholder="Learn More"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-5 h-5 bg-discord-darkest border-gray-700 rounded focus:ring-purple-600"
              />
              <span className="text-white">Active (visible to users)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_homepage}
                onChange={(e) => setFormData({...formData, show_on_homepage: e.target.checked})}
                className="w-5 h-5 bg-discord-darkest border-gray-700 rounded focus:ring-purple-600"
              />
              <span className="text-white">Show on Homepage</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_dashboard}
                onChange={(e) => setFormData({...formData, show_on_dashboard: e.target.checked})}
                className="w-5 h-5 bg-discord-darkest border-gray-700 rounded focus:ring-purple-600"
              />
              <span className="text-white">Show on Dashboard</span>
            </label>
          </div>

          {/* Notifications & Discord */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-white mb-3">Distribution Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_notifications}
                  onChange={(e) => setFormData({...formData, send_notifications: e.target.checked})}
                  className="w-5 h-5 bg-discord-darkest border-gray-700 rounded focus:ring-purple-600"
                />
                <div className="flex items-center gap-2">
                  <FaBell className="text-blue-400" />
                  <span className="text-white">Send in-app notifications to all users</span>
                </div>
              </label>

              {discordWebhook && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.send_discord}
                    onChange={(e) => setFormData({...formData, send_discord: e.target.checked})}
                    className="w-5 h-5 bg-discord-darkest border-gray-700 rounded focus:ring-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <FaDiscord className="text-purple-400" />
                    <span className="text-white">Post to Discord</span>
                  </div>
                </label>
              )}

              {!discordWebhook && (
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-3">
                  <p className="text-xs text-yellow-400">
                    💡 Discord webhook not configured. Go to Settings to add Discord integration.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaSave />
                  Create Announcement
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/announcements')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
