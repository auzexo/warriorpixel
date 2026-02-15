'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { PERMISSIONS } from '@/lib/admin';
import { FaCrown, FaPlus, FaTrash, FaUser } from 'react-icons/fa';

export default function PermissionsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [superAdminId, setSuperAdminId] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use fetch instead of Supabase client to avoid abort issues
      const response = await fetch('/api/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminId: superAdminId.trim(),
          superAdminPassword: superAdminPassword.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setLoading(false);
      loadAdmins();
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('*, users(username, email, uid)')
        .order('created_at', { ascending: false });

      if (data) setAdmins(data);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleDeleteAdmin = async (adminId, username) => {
    if (!confirm(`Remove admin access for ${username}?`)) return;

    try {
      await supabase.from('admin_logs').update({ admin_id: null }).eq('admin_id', adminId);
      const { error } = await supabase.from('admin_accounts').delete().eq('id', adminId);

      if (!error) {
        alert('Admin removed successfully');
        loadAdmins();
      } else {
        alert('Error: ' + error.message);
      }
    } catch (error) {
      alert('Error removing admin');
    }
  };

  if (!authenticated) {
    return (
      <AdminLayout>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-discord-dark rounded-xl p-8 border border-red-500">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCrown className="text-white text-4xl" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Permissions Panel</h1>
                <p className="text-discord-text">Super Admin Access Required</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <p className="text-red-500 text-sm font-semibold">Error:</p>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-discord-text mb-2">
                    Super Admin ID
                  </label>
                  <input
                    type="text"
                    value={superAdminId}
                    onChange={(e) => setSuperAdminId(e.target.value)}
                    placeholder="SUPERADMIN090909"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-discord-text mb-2">
                    Super Admin Password
                  </label>
                  <input
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Access Permissions Panel'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-semibold">✓ Authenticated</p>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FaCrown className="text-red-500" />
            Permissions Panel
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            <FaPlus /> Create Admin
          </button>
        </div>

        {loadingAdmins ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-discord-dark rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Admin Accounts ({admins.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white bg-opacity-5">
                  <tr>
                    <th className="text-left p-4 text-discord-text">User</th>
                    <th className="text-left p-4 text-discord-text">Admin ID</th>
                    <th className="text-left p-4 text-discord-text">Permissions</th>
                    <th className="text-right p-4 text-discord-text">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-gray-800">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-bold">
                            {admin.users?.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{admin.users?.username || 'Unknown'}</p>
                            <p className="text-xs text-discord-text">{admin.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-purple-400 font-mono">{admin.admin_id}</td>
                      <td className="p-4">
                        {admin.permissions.includes('full_access') ? (
                          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                            FULL ACCESS
                          </span>
                        ) : (
                          <span className="text-white text-sm">{admin.permissions.length} perms</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.users?.username)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreateModal && (
          <CreateAdminModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadAdmins();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function CreateAdminModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    adminId: '',
    adminPassword: '',
    permissionType: 'full_access',
  });

  useEffect(() => {
    supabase.from('users').select('id, username, email').eq('is_admin', false).then(({ data }) => {
      if (data) setUsers(data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let permissions = formData.permissionType === 'full_access' ? ['full_access'] : [];

      await supabase.from('users').update({ is_admin: true }).eq('id', formData.userId);
      const { error } = await supabase.from('admin_accounts').insert([{
        user_id: formData.userId,
        admin_id: formData.adminId,
        admin_password: formData.adminPassword,
        permissions,
      }]);

      if (error) throw error;
      alert('Admin created!');
      onSuccess();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-xl w-full max-w-2xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Create Admin</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
            required
          >
            <option value="">Select user...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
            ))}
          </select>
          <input
            type="text"
            value={formData.adminId}
            onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
            placeholder="Admin ID (e.g., ADMIN002)"
            className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
            required
          />
          <input
            type="text"
            value={formData.adminPassword}
            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            placeholder="Password"
            className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
