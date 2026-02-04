'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getTournaments, 
  createTournament, 
  updateTournament,
  deleteTournament, 
  getAllUsers,
  getTournamentParticipants,
  giveWinTag 
} from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { FaCrown, FaPlus, FaEdit, FaTrash, FaUsers, FaTrophy, FaBan, FaCoins, FaBell, FaGamepad } from 'react-icons/fa';
import { format } from 'date-fns';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showUserManageModal, setShowUserManageModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  
  // Selected items
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    game: 'freefire',
    status: 'upcoming',
    prize_pool: '',
    entry_fee: '0',
    max_participants: '50',
    tournament_date: '',
    room_id: '',
    room_password: '',
    description: '',
    rules: '',
  });

  const [userFormData, setUserFormData] = useState({
    wallet_real: '',
    wallet_coins: '',
    wallet_gems: '',
    status: 'active',
  });

  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
  });

  // Load data based on active tab
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

  // CREATE TOURNAMENT
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
      created_by: userProfile.id,
    };

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

  // EDIT TOURNAMENT
  const handleEditTournament = async (e) => {
    e.preventDefault();

    const updates = {
      name: formData.name,
      prize_pool: parseFloat(formData.prize_pool),
      entry_fee: parseFloat(formData.entry_fee),
      max_participants: parseInt(formData.max_participants),
      tournament_date: formData.tournament_date,
      room_id: formData.room_id || null,
      room_password: formData.room_password || null,
      description: formData.description || null,
      rules: formData.rules || null,
      status: formData.status,
    };

    if (formData.tournament_date) {
      const tournamentTime = new Date(formData.tournament_date);
      const visibleTime = new Date(tournamentTime.getTime() - 5 * 60000);
      updates.room_visible_at = visibleTime.toISOString();
    }

    const result = await updateTournament(selectedTournament.id, updates);
    if (result.success) {
      alert('✅ Tournament updated!');
      setShowEditModal(false);
      setSelectedTournament(null);
      resetForm();
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  // DELETE TOURNAMENT
  const handleDeleteTournament = async (tournamentId) => {
    if (!confirm('Delete this tournament? This cannot be undone!')) return;

    const result = await deleteTournament(tournamentId);
    if (result.success) {
      alert('✅ Tournament deleted!');
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  // GIVE WIN TAG
  const handleGiveWin = async (participantUserId) => {
    const prize = prompt('Enter prize amount (₹):');
    if (!prize) return;

    const result = await giveWinTag(participantUserId, selectedTournament.id, parseFloat(prize));
    if (result.success) {
      alert('✅ Win tag given & prize credited!');
      loadParticipants(selectedTournament.id);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  // USER MANAGEMENT
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const updates = {
      wallet_real: parseFloat(userFormData.wallet_real),
      wallet_coins: parseInt(userFormData.wallet_coins),
      wallet_gems: parseInt(userFormData.wallet_gems),
      status: userFormData.status,
    };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', selectedUser.id);

    if (error) {
      alert(`❌ Error: ${error.message}`);
    } else {
      alert('✅ User updated!');
      setShowUserManageModal(false);
      setSelectedUser(null);
      loadUsers();
    }
  };

  // SEND ANNOUNCEMENT
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();

    // Insert notification for ALL users
    const { data: allUsers } = await supabase.from('users').select('id');
    
    if (allUsers) {
      const notifications = allUsers.map(user => ({
        user_id: user.id,
        type: 'announcement',
        title: announcement.title,
        message: announcement.message,
        read: false,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) {
        alert(`❌ Error: ${error.message}`);
      } else {
        alert(`✅ Announcement sent to ${allUsers.length} users!`);
        setShowAnnouncementModal(false);
        setAnnouncement({ title: '', message: '' });
      }
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
      room_id: '',
      room_password: '',
      description: '',
      rules: '',
    });
  };

  const openEditModal = (tournament) => {
    setSelectedTournament(tournament);
    
    // Format date properly for datetime-local input
    let formattedDate = '';
    if (tournament.tournament_date) {
      try {
        const date = new Date(tournament.tournament_date);
        formattedDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      } catch (e) {
        console.error('Date formatting error:', e);
      }
    }
  
  setFormData({
    name: tournament.name || '',
    game: tournament.game || 'freefire',
    status: tournament.status || 'upcoming',
    prize_pool: tournament.prize_pool?.toString() || '',
    entry_fee: tournament.entry_fee?.toString() || '0',
    max_participants: tournament.max_participants?.toString() || '50',
    tournament_date: formattedDate,
    room_id: tournament.room_id || '',
    room_password: tournament.room_password || '',
    description: tournament.description || '',
    rules: tournament.rules || '',
  });
  
  setShowEditModal(true);
};

  const openUserManageModal = (user) => {
    setSelectedUser(user);
    setUserFormData({
      wallet_real: user.wallet_real?.toString() || '0',
      wallet_coins: user.wallet_coins?.toString() || '0',
      wallet_gems: user.wallet_gems?.toString() || '0',
      status: user.status || 'active',
    });
    setShowUserManageModal(true);
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
        <p className="text-white text-opacity-90">Manage tournaments, users, and platform</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 p-4 rounded-xl font-semibold transition-all"
        >
          <FaPlus className="text-2xl mx-auto mb-2" />
          Create Tournament
        </button>
        <button
          onClick={() => setShowAnnouncementModal(true)}
          className="bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-semibold transition-all"
        >
          <FaBell className="text-2xl mx-auto mb-2" />
          Send Announcement
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className="bg-green-600 hover:bg-green-700 p-4 rounded-xl font-semibold transition-all"
        >
          <FaUsers className="text-2xl mx-auto mb-2" />
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('tournaments')}
          className="bg-orange-600 hover:bg-orange-700 p-4 rounded-xl font-semibold transition-all"
        >
          <FaTrophy className="text-2xl mx-auto mb-2" />
          View Tournaments
        </button>
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
            <span className="hidden sm:inline">Tournaments</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUsers />
            <span className="hidden sm:inline">Users</span>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* TOURNAMENTS TAB */}
          {activeTab === 'tournaments' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Manage Tournaments</h3>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tournaments.length > 0 ? (
                <div className="space-y-3">
                  {tournaments.map((t) => (
                    <div key={t.id} className="bg-white bg-opacity-5 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{t.name}</h4>
                          {t.tournament_id && (
                            <p className="text-xs font-mono text-purple-400 mb-2">ID: {t.tournament_id}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="capitalize">{t.game}</span>
                            <span>•</span>
                            <span className="capitalize">{t.status}</span>
                            <span>•</span>
                            <span>₹{t.prize_pool}</span>
                            <span>•</span>
                            <span>{t.participants_count}/{t.max_participants}</span>
                            {t.room_id && <span>• Room: {t.room_id}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedTournament(t);
                              loadParticipants(t.id);
                              setShowParticipantsModal(true);
                            }}
                            className="p-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-400 transition-all"
                            title="View Participants"
                          >
                            <FaUsers />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-2 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-green-400 transition-all"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTournament(t.id)}
                            className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-red-400 transition-all"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
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
                        <th className="text-left py-3 px-2 md:px-4">Username</th>
                        <th className="text-left py-3 px-2 md:px-4 hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-2 md:px-4">Balance</th>
                        <th className="text-left py-3 px-2 md:px-4">Status</th>
                        <th className="text-left py-3 px-2 md:px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 50).map((user) => (
                        <tr key={user.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                          <td className="py-3 px-2 md:px-4">
                            <div>
                              <p className="font-semibold">{user.username}</p>
                              {user.is_admin && (
                                <span className="text-xs bg-red-500 bg-opacity-20 text-red-400 px-2 py-1 rounded">ADMIN</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4 text-xs text-gray-400 hidden md:table-cell">{user.email}</td>
                          <td className="py-3 px-2 md:px-4">
                            <div className="text-xs">
                              <p>₹{user.wallet_real?.toFixed(2) || '0.00'}</p>
                              <p className="text-gray-400">{user.wallet_gems || 0} 💎</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.status === 'active' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                              user.status === 'suspended' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                              'bg-red-500 bg-opacity-20 text-red-400'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <button
                              onClick={() => openUserManageModal(user)}
                              className="p-2 bg-purple-500 bg-opacity-20 hover:bg-opacity-30 rounded text-purple-400 text-xs"
                            >
                              Manage
                            </button>
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

      {/* CREATE/EDIT TOURNAMENT MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-3xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <h3 className="text-2xl font-bold mb-6">
              {showCreateModal ? 'Create Tournament' : 'Edit Tournament'}
            </h3>

            <form onSubmit={showCreateModal ? handleCreateTournament : handleEditTournament} className="space-y-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2 font-semibold">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tournament name"
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                  required
                  autoComplete="off"
                />
              </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Game *</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                    disabled={showEditModal}
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
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
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

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Room ID</label>
                  <input
                    type="text"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    placeholder="Upload 5 min before match"
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Room Password</label>
                  <input
                    type="text"
                    value={formData.room_password}
                    onChange={(e) => setFormData({ ...formData, room_password: e.target.value })}
                    placeholder="Upload 5 min before match"
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Rules</label>
                  <textarea
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows="3"
                    placeholder="One rule per line"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTournament(null);
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
                  {showCreateModal ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS MODAL - Continues in next message... */}
{/* PARTICIPANTS MODAL */}
      {showParticipantsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-5xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">Participants</h3>
                <p className="text-sm text-gray-400">{selectedTournament.name}</p>
                {selectedTournament.tournament_id && (
                  <p className="text-xs font-mono text-purple-400">ID: {selectedTournament.tournament_id}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowParticipantsModal(false);
                  setSelectedTournament(null);
                  setParticipants([]);
                }}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>

            {participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white border-opacity-10">
                      <th className="text-left py-3 px-2 md:px-4">Seat</th>
                      <th className="text-left py-3 px-2 md:px-4">Username</th>
                      <th className="text-left py-3 px-2 md:px-4">IGN</th>
                      <th className="text-left py-3 px-2 md:px-4 hidden md:table-cell">Paid</th>
                      <th className="text-left py-3 px-2 md:px-4">Status</th>
                      <th className="text-left py-3 px-2 md:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants
                      .sort((a, b) => (a.seat_number || 0) - (b.seat_number || 0))
                      .map((p) => (
                        <tr key={p.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                          <td className="py-3 px-2 md:px-4">
                            <span className="font-bold text-purple-400">#{p.seat_number}</span>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <div>
                              <p className="font-semibold">{p.user?.username || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{p.user?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className="font-mono text-cyan-400">{p.in_game_name}</span>
                          </td>
                          <td className="py-3 px-2 md:px-4 hidden md:table-cell">
                            {p.payment_verified ? (
                              <span className="text-green-400">✓ ₹{p.payment_amount}</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            {p.win_tag_given ? (
                              <div>
                                <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded text-xs font-bold">
                                  ✓ WINNER
                                </span>
                                {p.prize_won > 0 && (
                                  <p className="text-xs text-green-400 mt-1">₹{p.prize_won}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            {!p.win_tag_given && (
                              <button
                                onClick={() => handleGiveWin(p.user_id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-all"
                              >
                                Give Win
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{participants.length}</p>
                      <p className="text-xs text-gray-400">Total Joined</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">
                        {participants.filter(p => p.win_tag_given).length}
                      </p>
                      <p className="text-xs text-gray-400">Winners</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">
                        ₹{participants.reduce((sum, p) => sum + (p.payment_amount || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-400">Total Collected</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">
                        ₹{participants.reduce((sum, p) => sum + (p.prize_won || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-400">Total Paid Out</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No participants yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER MANAGEMENT MODAL */}
      {showUserManageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-2xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">Manage User</h3>
                <p className="text-sm text-gray-400">{selectedUser.username}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserManageModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <FaCoins className="inline mr-1" />
                    Real Money (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={userFormData.wallet_real}
                    onChange={(e) => setUserFormData({ ...userFormData, wallet_real: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Coins 🪙</label>
                  <input
                    type="number"
                    value={userFormData.wallet_coins}
                    onChange={(e) => setUserFormData({ ...userFormData, wallet_coins: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gems 💎</label>
                  <input
                    type="number"
                    value={userFormData.wallet_gems}
                    onChange={(e) => setUserFormData({ ...userFormData, wallet_gems: e.target.value })}
                    className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <FaBan className="inline mr-1" />
                  Account Status
                </label>
                <select
                  value={userFormData.status}
                  onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="active">Active ✓</option>
                  <option value="suspended">Suspended ⚠️</option>
                  <option value="banned">Banned ❌</option>
                </select>
              </div>

              <div className="bg-white bg-opacity-5 rounded-lg p-4">
                <h4 className="font-bold mb-2">Current Stats</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Total Wins:</p>
                    <p className="font-bold">{selectedUser.total_wins || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tournaments Played:</p>
                    <p className="font-bold">{selectedUser.total_tournaments_played || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Achievement Points:</p>
                    <p className="font-bold">{selectedUser.achievement_points || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Level:</p>
                    <p className="font-bold">{selectedUser.level || 1}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserManageModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-card rounded-2xl w-full max-w-2xl p-6 md:p-8 border border-white border-opacity-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaBell className="text-blue-500" />
                Send Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  placeholder="Important Update"
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Message *</label>
                <textarea
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="Enter your announcement message here..."
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  rows="5"
                  required
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {announcement.message.length}/500 characters
                </p>
              </div>

              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  📢 This will send a notification to ALL users on the platform
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Send Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
