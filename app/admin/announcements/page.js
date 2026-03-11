'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter } from 'next/navigation';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      alert('Error loading announcements');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error updating announcement status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete announcement: "${title}"?\n\nThis cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Announcement deleted successfully!');
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting announcement');
    } finally {
      setDeleting(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle className="text-yellow-400" />;
      case 'error': return <FaTimes className="text-red-400" />;
      case 'success': return <FaCheckCircle className="text-green-400" />;
      case 'tournament': return <FaBullhorn className="text-purple-400" />;
      default: return <FaInfoCircle className="text-blue-400" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      info: 'bg-blue-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      success: 'bg-green-600',
      tournament: 'bg-purple-600',
      maintenance: 'bg-gray-600'
    };
    return colors[type] || 'bg-gray-600';
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Announcements</h1>
            <p className="text-discord-text">Manage platform announcements and notifications</p>
          </div>
          <button
            onClick={() => router.push('/admin/announcements/create')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <FaPlus />
            New Announcement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-discord-text text-sm mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{announcements.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-discord-text text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{announcements.filter(a => a.is_active).length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-discord-text text-sm mb-1">On Homepage</p>
          <p className="text-2xl font-bold text-blue-400">{announcements.filter(a => a.show_on_homepage).length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-discord-text text-sm mb-1">Expired</p>
          <p className="text-2xl font-bold text-gray-400">
            {announcements.filter(a => a.expires_at && new Date(a.expires_at) < new Date()).length}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl overflow-hidden">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <FaBullhorn className="text-5xl text-gray-600 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">No announcements yet</p>
            <p className="text-discord-text mb-4">Create your first announcement to get started</p>
            <button
              onClick={() => router.push('/admin/announcements/create')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <FaPlus />
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-discord-darkest">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Announcement</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Display</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-discord-text uppercase">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-discord-text uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {announcements.map((announcement) => {
                  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
                  
                  return (
                    <tr key={announcement.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl mt-1">
                            {getTypeIcon(announcement.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-white mb-1">{announcement.title}</p>
                            <p className="text-sm text-discord-text line-clamp-2">{announcement.message}</p>
                            {isExpired && (
                              <span className="inline-block mt-1 px-2 py-1 bg-red-900 bg-opacity-30 text-red-400 text-xs rounded">
                                Expired
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 ${getTypeBadge(announcement.type)} text-white text-xs font-semibold rounded-full uppercase`}>
                          {announcement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-bold">{announcement.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {announcement.show_on_homepage && (
                            <span className="text-xs text-blue-400">📱 Homepage</span>
                          )}
                          {announcement.show_on_dashboard && (
                            <span className="text-xs text-green-400">🎮 Dashboard</span>
                          )}
                          {!announcement.show_on_homepage && !announcement.show_on_dashboard && (
                            <span className="text-xs text-gray-500">Hidden</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(announcement.id, announcement.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            announcement.is_active
                              ? 'bg-green-900 bg-opacity-30 text-green-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {announcement.is_active ? <FaEye /> : <FaEyeSlash />}
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-discord-text">
                        {new Date(announcement.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/announcements/edit/${announcement.id}`)}
                            className="p-2 hover:bg-blue-600 hover:bg-opacity-20 text-blue-400 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id, announcement.title)}
                            disabled={deleting === announcement.id}
                            className="p-2 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded-lg transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === announcement.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
