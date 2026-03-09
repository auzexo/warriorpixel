'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaUsers, FaSearch, FaEye, FaBan, FaFlag, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, banned, flagged

  useEffect(() => {
    loadUsers();
  }, [filterStatus]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: usersData, error: usersError } = await query;
      if (usersError) throw usersError;

      // Load bans and flags for each user
      const usersWithStatus = await Promise.all(
        (usersData || []).map(async (user) => {
          // Check active ban
          const { data: activeBan } = await supabase
            .from('user_bans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Check flagged status
          const { data: flaggedNotes } = await supabase
            .from('admin_notes')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_flagged', true);

          return {
            ...user,
            isBanned: !!activeBan,
            banInfo: activeBan,
            isFlagged: flaggedNotes && flaggedNotes.length > 0
          };
        })
      );

      // Apply filters
      let filteredUsers = usersWithStatus;
      
      if (filterStatus === 'banned') {
        filteredUsers = usersWithStatus.filter(u => u.isBanned);
      } else if (filterStatus === 'flagged') {
        filteredUsers = usersWithStatus.filter(u => u.isFlagged);
      } else if (filterStatus === 'active') {
        filteredUsers = usersWithStatus.filter(u => !u.isBanned);
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.id?.toLowerCase().includes(search)
    );
  });

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
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-discord-text">Manage users, bans, and flags</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-discord-text" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, email, or ID..."
                className="w-full pl-12 pr-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'banned', 'flagged'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-3 rounded-lg font-semibold capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-discord-darkest text-discord-text hover:bg-gray-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-sm text-discord-text">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaCheckCircle className="text-2xl text-green-400 mb-2" />
          <p className="text-sm text-discord-text">Active</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => !u.isBanned).length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaBan className="text-2xl text-red-400 mb-2" />
          <p className="text-sm text-discord-text">Banned</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.isBanned).length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaFlag className="text-2xl text-yellow-400 mb-2" />
          <p className="text-sm text-discord-text">Flagged</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.isFlagged).length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-discord-darkest">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Wallet</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-discord-text">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.username || 'Unknown'}</p>
                          <p className="text-xs text-discord-text font-mono">{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-400">₹{parseFloat(user.wallet_real || 0).toFixed(0)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isBanned && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                            BANNED
                          </span>
                        )}
                        {user.isFlagged && (
                          <FaFlag className="text-yellow-400" title="Flagged" />
                        )}
                        {!user.isBanned && !user.isFlagged && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-discord-text">
                        {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
                      >
                        <FaEye />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
