'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaUser, FaSearch, FaBan, FaPause, FaCheck, FaUsers, FaShieldAlt } from 'react-icons/fa';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    banned: 0,
    admins: 0,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
  
    try {
      console.log('Loading all users...');
      
      // Load ALL users from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error loading users:', error);
        throw error;
      }

      console.log('Loaded users:', data?.length);
      console.log('Users data:', data);

      setUsers(data || []);

      // Calculate stats
      const total = (data || []).length;
      const active = (data || []).filter(u => u.status === 'active').length;
      const suspended = (data || []).filter(u => u.status === 'suspended').length;
      const banned = (data || []).filter(u => u.status === 'banned').length;
      const admins = (data || []).filter(u => u.is_admin === true).length;
  
      console.log('Stats:', { total, active, suspended, banned, admins });

      setStats({ total, active, suspended, banned, admins });
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus, username) => {
    if (!confirm(`Change status of ${username} to ${newStatus}?`)) return;

    const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');

    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Log action
      const actionType = newStatus === 'banned' ? 'user_ban' :
                        newStatus === 'suspended' ? 'user_suspend' :
                        'user_activate';

      await logAdminAction(adminSession.adminAccountId, actionType, {
        targetUserId: userId,
        username: username,
        newStatus: newStatus,
      });

      alert(`User ${newStatus} successfully!`);
      loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error: ' + error.message);
    }
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-discord-text">Manage all registered users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-2xl text-purple-400" />
              <p className="text-sm text-discord-text">Total Users</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaCheck className="text-2xl text-green-400" />
              <p className="text-sm text-discord-text">Active</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.active}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaPause className="text-2xl text-yellow-400" />
              <p className="text-sm text-discord-text">Suspended</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.suspended}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaBan className="text-2xl text-red-400" />
              <p className="text-sm text-discord-text">Banned</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.banned}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaShieldAlt className="text-2xl text-red-400" />
              <p className="text-sm text-discord-text">Admins</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.admins}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, email, or UID..."
                className="w-full pl-10 pr-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">
              Users ({filteredUsers.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-discord-text mt-4">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white bg-opacity-5">
                  <tr>
                    <th className="text-left p-4 text-discord-text font-semibold">User</th>
                    <th className="text-left p-4 text-discord-text font-semibold">UID</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Level</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Wallet</th>
                    <th className="text-left p-4 text-discord-text font-semibold">Status</th>
                    <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                              {user.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {user.username || 'No Username'}
                                {user.is_admin && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                                    ADMIN
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-discord-text">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-purple-400">
                            {user.uid || 'No UID'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-semibold">
                            Level {user.level || 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 font-semibold">
                            ₹{parseFloat(user.wallet_real || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'active' ? 'bg-green-500 text-white' :
                            user.status === 'suspended' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {user.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            {user.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(user.id, 'suspended', user.username)}
                                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-all"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleStatusChange(user.id, 'banned', user.username)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all"
                                >
                                  Ban
                                </button>
                              </>
                            )}
                            {user.status !== 'active' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active', user.username)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-discord-text">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
          }
