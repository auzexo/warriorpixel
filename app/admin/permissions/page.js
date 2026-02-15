'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/admin';
import { FaCrown, FaPlus, FaTrash, FaUser, FaShieldAlt } from 'react-icons/fa';

// WHITELIST OF EMAILS ALLOWED TO ACCESS THIS PANEL
const ALLOWED_EMAILS = [
  'wpgames.moderator@gmail.com',
  // Add more admin emails here if needed
];

export default function PermissionsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && profile) {
      if (ALLOWED_EMAILS.includes(profile.email)) {
        setHasAccess(true);
        loadAdmins();
      }
    }
  }, [profile, authLoading]);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('*, users(username, email, uid)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admins:', error);
      }

      if (data) {
        setAdmins(data);
      }
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

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AdminLayout>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="max-w-md w-full bg-discord-dark rounded-xl p-8 border border-red-500">
            <div className="text-center">
              <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-discord-text mb-4">
                This permissions panel is restricted to authorized administrators only.
              </p>
              <p className="text-sm text-discord-text mb-6">
                Your email: <span className="text-white font-mono">{profile?.email || 'Not logged in'}</span>
              </p>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                Return to Dashboard
              </button>
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
          <p className="text-green-400 font-semibold">✓ Access Granted</p>
          <p className="text-discord-text text-sm mt-1">Logged in as: {profile.email}</p>
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
                    <th className="text-left p-4 text-discord-text">Status</th>
                    <th className="text-right p-4 text-discord-text">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
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
                      <td className="p-4 text-purple-400 font-mono text-sm">{admin.admin_id}</td>
                      <td className="p-4">
                        {admin.permissions.includes('full_access') ? (
                          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                            FULL ACCESS
                          </span>
                        ) : (
                          <span className="text-white text-sm">{admin.permissions.length} permissions</span>
                        )}
                      </td>
                      <td className="p-4">
                        {admin.is_active ? (
                          <span className="text-green-400 text-sm">✓ Active</span>
                        ) : (
                          <span className="text-red-400 text-sm">✗ Inactive</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.users?.username)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
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
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState({
    userId: '',
    adminId: '',
    adminPassword: '',
    permissionType: 'full_access',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    
    try {
      console.log('Loading users for dropdown...');
      
      // Load ALL non-admin users
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, uid, is_admin')
        .eq('is_admin', false)
        .order('username', { ascending: true });

      console.log('Loaded users:', data?.length, 'Error:', error);

      if (error) {
        console.error('Error loading users:', error);
        alert('Error loading users: ' + error.message);
      }

      if (data && data.length > 0) {
        setUsers(data);
      } else {
        console.warn('No non-admin users found');
      }
    } catch (error) {
      console.error('Error in loadUsers:', error);
      alert('Error loading users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let permissions = [];
      
      if (formData.permissionType === 'full_access') {
        permissions = ['full_access'];
      } else if (formData.permissionType === 'tournament_only') {
        permissions = [
          PERMISSIONS.TOURNAMENT_CREATE,
          PERMISSIONS.TOURNAMENT_EDIT,
          PERMISSIONS.TOURNAMENT_DELETE,
          PERMISSIONS.TOURNAMENT_MANAGE_PARTICIPANTS,
        ];
      } else if (formData.permissionType === 'user_only') {
        permissions = [
          PERMISSIONS.USER_VIEW,
          PERMISSIONS.USER_EDIT_CURRENCY,
          PERMISSIONS.USER_BAN,
          PERMISSIONS.USER_SUSPEND,
          PERMISSIONS.USER_GIVE_REWARDS,
        ];
      }

      // Set user as admin
      await supabase.from('users').update({ is_admin: true }).eq('id', formData.userId);

      // Create admin account
      const { error } = await supabase.from('admin_accounts').insert([{
        user_id: formData.userId,
        admin_id: formData.adminId,
        admin_password: formData.adminPassword,
        permissions,
      }]);

      if (error) throw error;

      alert('Admin account created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-xl w-full max-w-2xl p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create Admin Account</h2>
        
        {loadingUsers ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-discord-text mt-2">Loading users...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Select User *
              </label>
              {users.length > 0 ? (
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email}) - {u.uid}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    No non-admin users found. All users are already admins or no users exist.
                  </p>
                </div>
              )}
            </div>

            {users.length > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-discord-text mb-2">
                    Admin ID *
                  </label>
                  <input
                    type="text"
                    value={formData.adminId}
                    onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                    placeholder="e.g., ADMIN002"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-discord-text mb-2">
                    Admin Password *
                  </label>
                  <input
                    type="text"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-discord-text mb-2">
                    Permission Level *
                  </label>
                  <select
                    value={formData.permissionType}
                    onChange={(e) => setFormData({ ...formData, permissionType: e.target.value })}
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white"
                  >
                    <option value="full_access">Full Access (All Permissions)</option>
                    <option value="tournament_only">Tournament Management Only</option>
                    <option value="user_only">User Management Only</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-bold"
              >
                Cancel
              </button>
              {users.length > 0 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
      }
