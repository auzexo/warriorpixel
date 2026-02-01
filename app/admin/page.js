// app/admin/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getTournaments, 
  createTournament, 
  updateTournament, 
  deleteTournament,
  getTournamentParticipants,
  getAllUsers,
  giveWinTag
} from '@/lib/database';
import { FaCrown, FaPlus, FaEdit, FaTrash, FaUsers, FaTrophy, FaGamepad } from 'react-icons/fa';
import { format } from 'date-fns';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    game: 'freefire',
    status: 'upcoming',
    prize_pool: '',
    entry_fee: '',
    max_participants: '',
    tournament_date: '',
    room_id: '',
    room_password: '',
    description: '',
    rules: ''
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

  const loadParticipants = async (tournamentId) => {
    const result = await getTournamentParticipants(tournamentId);
    if (result.success) {
      setParticipants(result.data);
    }
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
      room_id: formData.room_id || null,
      room_password: formData.room_password || null,
      description: formData.description || null,
      rules: formData.rules || null,
      participants_count: 0,
      created_by: userProfile.id
    };

    // Set room_visible_at to 5 minutes before tournament
    if (formData.tournament_date) {
      const tournamentTime = new Date(formData.tournament_date);
      const visibleTime = new Date(tournamentTime.getTime() - 5 * 60000);
      tournamentData.room_visible_at = visibleTime.toISOString();
    }

    const result = await createTournament(tournamentData);
    if (result.success) {
      alert('✅ Tournament created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    const result = await deleteTournament(tournamentId);
    if (result.success) {
      alert('✅ Tournament deleted!');
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleGiveWinTag = async (userId, tournamentId) => {
    const prize = prompt('Enter prize amount (₹):');
    if (!prize) return;

    const result = await giveWinTag(userId, tournamentId, parseFloat(prize));
    if (result.success) {
      alert('✅ Win tag given & prize credited!');
      loadParticipants(tournamentId);
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
      entry_fee: '',
      max_participants: '',
      tournament_date: '',
      room_id: '',
      room_password: '',
      description: '',
      rules: ''
    });
  };

  if (!userProfile?.is_admin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaCrown className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You don't have permission to access this page</p>
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
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Manage tournaments, users, and platform settings
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-primary-card rounded-xl border border-white border-opacity-5">
        <div className="flex border-b border-white border-opacity-5">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 px-4 md:px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tournaments' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaTrophy />
            <span className="hidden sm:inline">Tournaments</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 md:px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUsers />
            <span className="hidden sm:inline">Users</span>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'tournaments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Manage Tournaments</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm"
                >
                  <FaPlus />
                  <span className="hidden sm:inline">Create</span>
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white bg-opacity-5 rounded-lg h-20 skeleton"></div>
                  ))}
                </div>
              ) : tournaments.length > 0 ? (
                <div className="space-y-3">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="bg-white bg-opacity-5 rounded-lg p-4 hover:bg-opacity-10 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">{tournament.name}</h4>
                          <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                            <span className="capitalize">{tournament.game}</span>
                            <span>•</span>
                            <span className="capitalize">{tournament.status}</span>
                            <span>•</span>
                            <span>₹{tournament.prize_pool}</span>
                            <span>•</span>
                            <span>{tournament.participants_count}/{tournament.max_participants} players</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedTournament(tournament);
                              loadParticipants(tournament.id);
                            }}
                            className="p-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-400 transition-all"
                          >
                            <FaUsers />
                          </button>
                          <button className="p-2 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-green-400 transition-all">
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTournament(tournament.id)}
                            className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-red-400 transition-all"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No tournaments yet. Click "Create" to add one.
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-xl font-bold mb-6">User Management</h3>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white bg-opacity-5 rounded-lg h-16 skeleton"></div>
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white border-opacity-5">
                        <th className="text-left py-3 px-2 md:px-4">Username</th>
                        <th className="text-left py-3 px-2 md:px-4 hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-2 md:px-4">Wins</th>
                        <th className="text-left py-3 px-2 md:px-4">Wallet</th>
                        <th className="text-left py-3 px-2 md:px-4">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 20).map((user) => (
                        <tr key={user.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                          <td className="py-3 px-2 md:px-4">{user.username}</td>
                          <td className="py-3 px-2 md:px-4 text-gray-400 hidden md:table-cell text-xs">{user.email}</td>
                          <td className="py-3 px-2 md:px-4">{user.total_wins}</td>
                          <td className="py-3 px-2 md:px-4">₹{user.wallet_real?.toFixed(0)}</td>
                          <td className="py-3 px-2 md:px-4">
                            {user.is_admin ? (
                              <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs font-bold">
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

      {/* Create Tournament Modal - Continue in next message due to length... */}
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
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Game *</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="freefire">Free Fire</option>
                    <option value="bgmi">BGMI</option>
                    <option value="stumbleguys">Stumble Guys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Prize Pool (₹) *</label>
                  <input
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entry Fee (₹) *</label>
                  <select
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                    className="input"
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
                  <label className="block text-sm text-gray-400 mb-2">Max Participants *</label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="input"
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
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Room ID</label>
                  <input
                    type="text"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="input"
                    placeholder="Upload 5 min before"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Room Password</label>
                  <input
                    type="text"
                    value={formData.room_password}
                    onChange={(e) => setFormData({ ...formData, room_password: e.target.value })}
                    className="input"
                    placeholder="Upload 5 min before"
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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-4xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Participants - {selectedTournament.name}</h3>
              <button
                onClick={() => setSelectedTournament(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white border-opacity-5">
                    <th className="text-left py-3 px-4">Seat</th>
                    <th className="text-left py-3 px-4">Username</th>
                    <th className="text-left py-3 px-4">IGN</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-white border-opacity-5">
                      <td className="py-3 px-4">#{p.seat_number}</td>
                      <td className="py-3 px-4">{p.user?.username}</td>
                      <td className="py-3 px-4">{p.in_game_name}</td>
                      <td className="py-3 px-4">
                        {!p.win_tag_given && (
                          <button
                            onClick={() => handleGiveWinTag(p.user_id, selectedTournament.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Give Win
                          </button>
                        )}
                        {p.win_tag_given && (
                          <span className="text-green-400 text-xs">✓ Winner</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
