'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getTournaments, createTournament, deleteTournament, getAllUsers } from '@/lib/database';
import { FaCrown, FaPlus, FaTrash, FaUsers, FaTrophy } from 'react-icons/fa';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    game: 'freefire',
    status: 'upcoming',
    prize_pool: '',
    entry_fee: '0',
    max_participants: '50',
    tournament_date: '',
    description: '',
  });

  useEffect(() => {
    if (userProfile && !userProfile.is_admin) {
      router.push('/');
    }
  }, [userProfile, router]);

  useEffect(() => {
    if (activeTab === 'tournaments') {
      loadTournaments();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadTournaments = async () => {
    setLoading(true);
    const result = await getTournaments({});
    if (result.success) {
      setTournaments(result.data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.data);
    }
    setLoading(false);
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();

    const tournamentData = {
      name: formData.name,
      game: formData.game,
      status: formData.status,
      prize_pool: parseFloat(formData.prize_pool),
      entry_fee: parseFloat(formData.entry_fee),
      max_participants: parseInt(formData.max_participants),
      tournament_date: formData.tournament_date,
      description: formData.description || null,
      participants_count: 0,
      created_by: userProfile.id,
    };

    // Set room_visible_at to 5 minutes before tournament
    if (formData.tournament_date) {
      const tournamentTime = new Date(formData.tournament_date);
      const visibleTime = new Date(tournamentTime.getTime() - 5 * 60000);
      tournamentData.room_visible_at = visibleTime.toISOString();
    }

    const result = await createTournament(tournamentData);
    if (result.success) {
      alert('✅ Tournament created!\nID: ' + (result.data.tournament_id || 'Generated'));
      setShowCreateModal(false);
      resetForm();
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!confirm('Delete this tournament?')) return;

    const result = await deleteTournament(tournamentId);
    if (result.success) {
      alert('✅ Tournament deleted!');
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      game: 'freefire',
      status: 'upcoming',
      prize_pool: '',
      entry_fee: '0',
      max_participants: '50',
      tournament_date: '',
      description: '',
    });
  };

  if (!userProfile?.is_admin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaCrown className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You don't have permission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaCrown />
          Admin Panel
        </h1>
        <p className="text-white text-opacity-90">Manage tournaments and users</p>
      </div>

      {/* Tabs */}
      <div className="bg-primary-card rounded-xl border border-white border-opacity-5">
        <div className="flex border-b border-white border-opacity-5">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tournaments' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaTrophy />
            Tournaments
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUsers />
            Users
          </button>
        </div>

        <div className="p-6">
          {/* TOURNAMENTS TAB */}
          {activeTab === 'tournaments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Manage Tournaments</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <FaPlus />
                  Create
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tournaments.length > 0 ? (
                <div className="space-y-3">
                  {tournaments.map((t) => (
                    <div key={t.id} className="bg-white bg-opacity-5 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{t.name}</h4>
                        {t.tournament_id && (
                          <p className="text-xs font-mono text-purple-400">ID: {t.tournament_id}</p>
                        )}
                        <p className="text-sm text-gray-400">
                          {t.game} • {t.status} • ₹{t.prize_pool} • {t.participants_count}/{t.max_participants}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTournament(t.id)}
                        className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-red-400"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No tournaments yet</div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-xl font-bold mb-6">User Management</h3>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white border-opacity-5">
                        <th className="text-left py-3 px-4">Username</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 20).map((user) => (
                        <tr key={user.id} className="border-b border-white border-opacity-5">
                          <td className="py-3 px-4">{user.username}</td>
                          <td className="py-3 px-4 text-xs text-gray-400">{user.email}</td>
                          <td className="py-3 px-4">₹{user.wallet_real?.toFixed(2) || '0.00'}</td>
                          <td className="py-3 px-4">
                            {user.is_admin ? (
                              <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs">
                                ADMIN
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-500 bg-opacity-20 text-gray-400 rounded text-xs">
                                User
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No users found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-2xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <h3 className="text-2xl font-bold mb-6">Create Tournament</h3>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Tournament Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Game *</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="freefire">Free Fire</option>
                    <option value="bgmi">BGMI</option>
                    <option value="stumbleguys">Stumble Guys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Prize Pool (₹) *</label>
                  <input
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entry Fee (₹) *</label>
                  <select
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="0">Free</option>
                    <option value="10">₹10</option>
                    <option value="20">₹20</option>
                    <option value="30">₹30</option>
                    <option value="50">₹50</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Players *</label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                    max="50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.tournament_date}
                    onChange={(e) => setFormData({ ...formData, tournament_date: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
