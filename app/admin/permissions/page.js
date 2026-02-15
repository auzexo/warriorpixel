'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { PERMISSIONS } from '@/lib/admin';
import { FaLock, FaCrown, FaUser, FaPlus, FaTrash } from 'react-icons/fa';

export default function PermissionsPage() {
  const router = useRouter();
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
      console.log('🔍 Starting super admin verification...');
      console.log('Input ID:', superAdminId);
      console.log('Input ID length:', superAdminId.length);
      console.log('Input Password length:', superAdminPassword.length);
  
      // Trim any whitespace
      const trimmedId = superAdminId.trim();
      const trimmedPassword = superAdminPassword.trim();
  
      console.log('Trimmed ID:', trimmedId);
      console.log('Trimmed ID length:', trimmedId.length);
  
      // Direct query to verify super admin
      const { data: superAdmin, error: queryError } = await supabase
        .from('super_admin_whitelist')
        .select('*')
        .eq('super_admin_id', trimmedId)
        .eq('super_admin_password', trimmedPassword)
        .single();
  
      console.log('📊 Query result:', { 
        found: !!superAdmin, 
        error: queryError?.message,
        errorCode: queryError?.code,
        data: superAdmin 
      });
  
      if (queryError) {
        console.error('❌ Database error:', queryError);
        setError('Database error: ' + queryError.message);
        setLoading(false);
        return;
      }

      if (!superAdmin) {
        console.error('❌ No matching super admin found');
        
        // Check if ANY super admin exists
        const { data: allSuperAdmins, error: checkError } = await supabase
          .from('super_admin_whitelist')
          .select('super_admin_id');
        
        console.log('All super admins in database:', allSuperAdmins);
        
        setError('Invalid super admin credentials. Please check your ID and password.');
        setLoading(false);
        return;
      }
  
      console.log('✅ Super admin verified successfully!');
      
      // Set authenticated FIRST
      setAuthenticated(true);
      setLoading(false);
      
      // Load admins
      loadAdmins();
      
    } catch (error) {
      console.error('❌ Super admin login error:', error);
      setError('Login failed: ' + error.message);
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    
    try {
      console.log('Loading admin accounts...');
      
      const { data, error } = await supabase
        .from('admin_accounts')
        .select(`
          *,
          users(username, email, uid)
        `)
        .order('created_at', { ascending: false });

      console.log('Admin accounts loaded:', { count: data?.length, error });

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
      // First, remove references in admin_logs
      await supabase
        .from('admin_logs')
        .update({ admin_id: null })
        .eq('admin_id', adminId);

      // Then delete admin account
      const { error } = await supabase
        .from('admin_accounts')
        .delete()
        .eq('id', adminId);

      if (!error) {
        alert('Admin removed successfully');
        loadAdmins();
      } else {
        alert('Error: ' + error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error removing admin');
    }
  };

  // LOGIN FORM (shown when not authenticated)
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
                  <p className="text-red-500 text-sm font-semibold">❌ Error:</p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
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
                    placeholder="Enter super admin ID"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    required
                    disabled={loading}
                    autoComplete="off"
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
                    placeholder="Enter super admin password"
                    className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    required
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </span>
                  ) : (
                    'Access Permissions Panel'
                  )}
                </button>
              </form>

              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">
                  Your credentials: SUPERADMIN090909
                </p>
              </div>

              <div className="mt-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-xs font-semibold">🔒 Restricted Access</p>
                <p className="text-discord-text text-xs mt-1">
                  This panel is only accessible to super administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // PERMISSIONS PANEL (shown when authenticated)
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-semibold">✓ Super Admin Authenticated</p>
          <p className="text-discord-text text-sm mt-1">You now have access to manage admin accounts</p>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <FaCrown className="text-red-500" />
              Permissions Panel
            </h1>
            <p className="text-discord-text">Manage admin accounts and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <FaPlus />
            Create Admin Account
          </button>
        </div>

        {/* Loading State */}
        {loadingAdmins && (
          <div className="bg-discord-dark rounded-xl p-8 border border-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-discord-text">Loading admin accounts...</p>
            </div>
          </div>
        )}

        {/* Admin Accounts Table */}
        {!loadingAdmins && (
          <div className="bg-discord-dark rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Admin Accounts ({admins.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white bg-opacity-5">
                  <tr>
                    <th className="text-left p-4 text-discord-text font-semibold">User</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Admin ID</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Permissions</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Last Login</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Status</th>
                    <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center font-bold">
                              {admin.users?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{admin.users?.username || 'Unknown'}</p>
                              <p className="text-xs text-discord-text">{admin.users?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-purple-400">{admin.admin_id}</span>
                        </td>
                        <td className="p-4">
                          {admin.permissions.includes('full_access') ? (
                            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                              FULL ACCESS
                            </span>
                          ) : (
                            <span className="text-sm text-white">{admin.permissions.length} permissions</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-discord-text">
                            {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-IN') : 'Never'}
                          </span>
                        </td>
                        <td className="p-4">
                          {admin.is_active ? (
                            <span className="text-green-400 text-sm">✓ Active</span>
                          ) : (
                            <span className="text-red-400 text-sm">✗ Inactive</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.users?.username || 'this admin')}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                              title="Remove Admin"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-discord-text">
                        <FaUser className="text-6xl mx-auto mb-4 opacity-30" />
                        <p>No admin accounts found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Modal */}
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

// Create Admin Modal (same as before - keeping for completeness)
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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, username, email, is_admin')
      .eq('is_admin', false);

    if (data) {
      setUsers(data);
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
      await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', formData.userId);

      // Create admin account
      const { error } = await supabase
        .from('admin_accounts')
        .insert([{
          user_id: formData.userId,
          admin_id: formData.adminId,
          admin_password: formData.adminPassword,
          permissions: permissions,
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
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-xl w-full max-w-2xl p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create Admin Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Select User *</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            >
              <option value="">Choose a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Admin ID *</label>
            <input
              type="text"
              value={formData.adminId}
              onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
              placeholder="e.g., ADMIN002"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Admin Password *</label>
            <input
              type="text"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              placeholder="Create a strong password"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">Permission Level *</label>
            <select
              value={formData.permissionType}
              onChange={(e) => setFormData({ ...formData, permissionType: e.target.value })}
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            >
              <option value="full_access">Full Access (All Permissions)</option>
              <option value="tournament_only">Tournament Management Only</option>
              <option value="user_only">User Management Only</option>
            </select>
          </div>

          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4">
            <p className="text-yellow-400 text-sm font-semibold">⚠️ Important</p>
            <p className="text-discord-text text-sm mt-1">
              Share the Admin ID and Password securely.
            </p>
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
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
                      }
