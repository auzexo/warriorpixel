'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaUsers, FaSearch, FaBan, FaPause, FaEdit, FaGift, FaWallet } from 'react-icons/fa';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    suspended: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const loadUsers = async () => {
    setLoading(true);

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (data) {
      setUsers(data);
      
      // Calculate stats
      const stats = data.reduce((acc, user) => {
        acc.total++;
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, { total: 0, active: 0, banned: 0, suspended: 0 });
      
      setStats(stats);
    }

    setLoading(false);
  };

  const handleBanUser = async (userId, username) => {
    if (!confirm(`Ban user ${username}? They won't be able to access the platform.`)) return;

    const { error } = await supabase
      .from('users')
      .update({ status: 'banned' })
      .eq('id', userId);

    if (!error) {
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'user_ban', {
        targetUserId: userId,
        username: username,
      });

      alert('User banned successfully');
      loadUsers();
    } else {
      alert('Error banning user: ' + error.message);
    }
  };

  const handleSuspendUser = async (userId, username) => {
    if (!confirm(`Suspend user ${username}? They will have limited access.`)) return;

    const { error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId);

    if (!error) {
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'user_suspend', {
        targetUserId: userId,
        username: username,
      });

      alert('User suspended successfully');
      loadUsers();
    } else {
      alert('Error suspending user: ' + error.message);
    }
  };

  const handleActivateUser = async (userId, username) => {
    if (!confirm(`Activate user ${username}?`)) return;

    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId);

    if (!error) {
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'user_activate', {
        targetUserId: userId,
        username: username,
      });

      alert('User activated successfully');
      loadUsers();
    } else {
      alert('Error activating user: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-discord-text">View and manage all users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-green-500">
            <p className="text-discord-text text-sm mb-1">Active</p>
            <p className="text-3xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-red-500">
            <p className="text-discord-text text-sm mb-1">Banned</p>
            <p className="text-3xl font-bold text-red-400">{stats.banned}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-orange-500">
            <p className="text-discord-text text-sm mb-1">Suspended</p>
            <p className="text-3xl font-bold text-orange-400">{stats.suspended}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-discord-text mb-2">Search Users</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by username, email, or UID..."
                  className="w-full pl-10 pr-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-discord-text mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-discord-dark rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-5">
                <tr>
                  <th className="text-left p-4 text-discord-text font-semibold">User</th>
                  <th className="text-left p-4 text-discord-text font-semibold">UID</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Email</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Wallet</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Level</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Status</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Joined</th>
                  <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.username}</p>
                            <p className="text-xs text-discord-text">{user.achievement_points} pts</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-purple-400">{user.uid}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white">{user.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-semibold">₹{parseFloat(user.wallet_real || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-semibold">Level {user.level}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === 'active' ? 'bg-green-500 text-white' :
                          user.status === 'banned' ? 'bg-red-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-discord-text">
                          {new Date(user.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}/rewards`)}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
                            title="Give Rewards"
                          >
                            <FaGift />
                          </button>
                          {user.status === 'active' ? (
                            <>
                              <button
                                onClick={() => handleSuspendUser(user.id, user.username)}
                                className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all"
                                title="Suspend"
                              >
                                <FaPause />
                              </button>
                              <button
                                onClick={() => handleBanUser(user.id, user.username)}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                                title="Ban"
                              >
                                <FaBan />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id, user.username)}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
                              title="Activate"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-discord-text">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
      }
