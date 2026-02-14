'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaBullhorn, FaPlus, FaTrash, FaDiscord, FaClock } from 'react-icons/fa';

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setAnnouncements(data);
    }

    setLoading(false);
  };

  const handleDelete = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (!error) {
      alert('Announcement deleted');
      loadAnnouncements();
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
            <p className="text-discord-text">Create and manage platform announcements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <FaPlus />
            Create Announcement
          </button>
        </div>

        {/* Info */}
        <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-400 text-sm font-semibold">⏰ Auto-Delete</p>
          <p className="text-discord-text text-sm mt-1">
            Announcements are automatically deleted 24 hours after creation
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-discord-dark rounded-xl p-6 border border-gray-800"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBullhorn className={`text-2xl ${
                        announcement.priority === 'urgent' ? 'text-red-400' :
                        announcement.priority === 'high' ? 'text-orange-400' :
                        'text-blue-400'
                      }`} />
                      <div>
                        <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            announcement.priority === 'urgent' ? 'bg-red-500' :
                            announcement.priority === 'high' ? 'bg-orange-500' :
                            announcement.priority === 'normal' ? 'bg-blue-500' :
                            'bg-gray-500'
                          } text-white`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-500 bg-opacity-20 text-purple-400">
                            {announcement.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-discord-text mt-3">{announcement.message}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <span className="text-discord-text flex items-center gap-1">
                        <FaClock />
                        {getTimeRemaining(announcement.expires_at)}
                      </span>
                      {announcement.sent_to_discord && (
                        <span className="text-green-400 flex items-center gap-1">
                          <FaDiscord />
                          Sent to Discord
                        </span>
                      )}
                      <span className="text-discord-text">
                        {new Date(announcement.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-discord-dark rounded-xl border border-gray-800">
              <FaBullhorn className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-discord-text">No announcements</p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateAnnouncementModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadAnnouncements();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Create Announcement Modal Component
function CreateAnnouncementModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'normal',
    sendToDiscord: false,
    discordWebhook: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create announcement
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: formData.title,
          message: formData.message,
          type: formData.type,
          priority: formData.priority,
          discord_webhook_url: formData.sendToDiscord ? formData.discordWebhook : null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send to Discord if enabled
      if (formData.sendToDiscord && formData.discordWebhook) {
        try {
          await fetch(formData.discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: `📢 ${formData.title}`,
                description: formData.message,
                color: formData.priority === 'urgent' ? 0xFF0000 :
                       formData.priority === 'high' ? 0xFF6600 : 0x5865F2,
                footer: { text: 'WarriorPixel Announcement' },
                timestamp: new Date().toISOString(),
              }]
            }),
          });

          // Mark as sent
          await supabase
            .from('announcements')
            .update({ sent_to_discord: true })
            .eq('id', data.id);
        } catch (discordError) {
          console.error('Discord webhook error:', discordError);
        }
      }

      // Create notification for all users
      const { data: users } = await supabase.from('users').select('id');
      if (users && users.length > 0) {
        const notifications = users.map(user => ({
          user_id: user.id,
          title: formData.title,
          message: formData.message,
          type: 'announcement',
        }));

        await supabase.from('notifications').insert(notifications);
      }

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'announcement_create', {
        title: formData.title,
        priority: formData.priority,
      });

      alert('Announcement created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-xl w-full max-w-2xl p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create Announcement</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Announcement title"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Announcement message"
              rows="4"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="general">General</option>
                <option value="tournament">Tournament</option>
                <option value="maintenance">Maintenance</option>
                <option value="update">Update</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="sendToDiscord"
                checked={formData.sendToDiscord}
                onChange={(e) => setFormData({ ...formData, sendToDiscord: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="sendToDiscord" className="text-white font-medium">
                Send to Discord
              </label>
            </div>

            {formData.sendToDiscord && (
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Discord Webhook URL *
                </label>
                <input
                  type="url"
                  value={formData.discordWebhook}
                  onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required={formData.sendToDiscord}
                />
                <p className="text-xs text-discord-text mt-1">
                  Get webhook URL from Discord Server Settings → Integrations → Webhooks
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  }
