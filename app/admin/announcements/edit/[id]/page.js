'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSave, FaBullhorn } from 'react-icons/fa';

export default function EditAnnouncementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    link_text: ''
  });

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          priority: data.priority || 50,
          is_active: data.is_active ?? true,
          show_on_homepage: data.show_on_homepage ?? true,
          show_on_dashboard: data.show_on_dashboard ?? false,
          expires_at: data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : '',
          link_url: data.link_url || '',
          link_text: data.link_text || ''
        });
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
      alert('Error loading announcement');
      router.push('/admin/announcements');
    } finally {
      setLoading(false);
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
      const updateData = {
        ...formData,
        expires_at: formData.expires_at || null,
        link_url: formData.link_url || null,
        link_text: formData.link_text || null
      };

      const { error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      alert('✅ Announcement updated successfully!');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Error updating announcement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

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
          Edit Announcement
        </h1>
        <p className="text-discord-text">Update announcement details</p>
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

          {/* Checkboxes */}
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
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
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
