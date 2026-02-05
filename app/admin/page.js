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
import { FaCrown, FaPlus, FaEdit, FaTrash, FaUsers, FaTrophy, FaBan, FaCoins, FaBell, FaTimes } from 'react-icons/fa';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showUserManageModal, setShowUserManageModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  
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
      created_by: userProfile.id,
    };
    if (formData.tournament_date) {
      const tournamentTime = new Date(formData.tournament_date);
      const visibleTime = new Date(tournamentTime.getTime() - 5 * 60000);
      tournamentData.room_visible_at = visibleTime.toISOString();
    }
    const result = await createTournament(tournamentData);
    if (result.success) {
      alert('✅ Created! ID: ' + (result.data.tournament_id || ''));
      setShowCreateModal(false);
      resetForm();
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

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
      alert('✅ Updated!');
      setShowEditModal(false);
      setSelectedTournament(null);
      resetForm();
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!confirm('Delete?')) return;
    const result = await deleteTournament(tournamentId);
    if (result.success) {
      alert('✅ Deleted!');
      loadTournaments();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleGiveWin = async (participantUserId) => {
    const prize = prompt('Prize amount (₹):');
    if (!prize) return;
    const result = await giveWinTag(participantUserId, selectedTournament.id, parseFloat(prize));
    if (result.success) {
      alert('✅ Win given!');
      loadParticipants(selectedTournament.id);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const updates = {
      wallet_real: parseFloat(userFormData.wallet_real) || 0,
      wallet_coins: parseInt(userFormData.wallet_coins) || 0,
      wallet_gems: parseInt(userFormData.wallet_gems) || 0,
      status: userFormData.status,
    };
    const { error } = await supabase.from('users').update(updates).eq('id', selectedUser.id);
    if (error) {
      alert(`❌ ${error.message}`);
    } else {
      alert('✅ Updated!');
      setShowUserManageModal(false);
      setSelectedUser(null);
      loadUsers();
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    const { data: allUsers } = await supabase.from('users').select('id').eq('status', 'active');
    if (allUsers) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);
      const notifications = allUsers.map(user => ({
        user_id: user.id,
        type: 'announcement',
        title: announcement.title,
        message: announcement.message,
        read: false,
        expires_at: expiryDate.toISOString(),
      }));
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) {
        alert(`❌ ${error.message}`);
      } else {
        alert(`✅ Sent to ${allUsers.length} users!`);
        setShowAnnouncementModal(false);
        setAnnouncement({ title: '', message: '' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', game: 'freefire', status: 'upcoming', prize_pool: '',
      entry_fee: '0', max_participants: '50', tournament_date: '',
      room_id: '', room_password: '', description: '', rules: '',
    });
  };

  const openEditModal = (tournament) => {
    setSelectedTournament(tournament);
    let formattedDate = '';
    if (tournament.tournament_date) {
      try {
        formattedDate = new Date(tournament.tournament_date).toISOString().slice(0, 16);
      } catch (e) {}
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
          <h2 className="text-2xl font-bold">Admin Only</h2>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaCrown />
          Admin Panel
        </h1>
        <p className="text-white text-opacity-90">Manage tournaments and users</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700 p-4 rounded-xl font-semibold transition-all">
          <FaPlus className="text-2xl mx-auto mb-2" />
          Create
        </button>
        <button onClick={() => setShowAnnouncementModal(true)} className="bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-semibold transition-all">
          <FaBell className="text-2xl mx-auto mb-2" />
          Announce
        </button>
        <button onClick={() => setActiveTab('users')} className="bg-green-600 hover:bg-green-700 p-4 rounded-xl font-semibold transition-all">
          <FaUsers className="text-2xl mx-auto mb-2" />
          Users
        </button>
        <button onClick={() => setActiveTab('tournaments')} className="bg-orange-600 hover:bg-orange-700 p-4 rounded-xl font-semibold transition-all">
          <FaTrophy className="text-2xl mx-auto mb-2" />
          Tournaments
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-primary-card rounded-xl border border-white border-opacity-5">
        <div className="flex border-b border-white border-opacity-5">
          <button onClick={() => setActiveTab('tournaments')} className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'tournaments' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <FaTrophy />
            <span className="hidden sm:inline">Tournaments</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
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
                          {t.tournament_id && <p className="text-xs font-mono text-purple-400 mb-2">ID: {t.tournament_id}</p>}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="capitalize">{t.game}</span>
                            <span>•</span>
                            <span className="capitalize">{t.status}</span>
                            <span>•</span>
                            <span>₹{t.prize_pool}</span>
                            <span>•</span>
                            <span>{t.participants_count}/{t.max_participants}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedTournament(t); loadParticipants(t.id); setShowParticipantsModal(true); }} className="p-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-400 transition-all" title="Participants">
                            <FaUsers />
                          </button>
                          <button onClick={() => openEditModal(t)} className="p-2 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-green-400 transition-all" title="Edit">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDeleteTournament(t.id)} className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-red-400 transition-all" title="Delete">
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
                <div className="space-y-2">
                  {users.slice(0, 50).map((user) => (
                    <div key={user.id} className="bg-white bg-opacity-5 rounded-lg p-4 flex justify-between items-center hover:bg-opacity-10">
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500">₹{user.wallet_real?.toFixed(2)} • {user.wallet_gems}💎</p>
                      </div>
                      <button onClick={() => openUserManageModal(user)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">
                        Manage
                      </button>
                    </div>
                  ))}
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{showCreateModal ? 'Create Tournament' : 'Edit Tournament'}</h3>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedTournament(null); resetForm(); }} className="text-gray-400 hover:text-white text-3xl">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateTournament : handleEditTournament} className="space-y-4">
                <div className="md:col-span-2">
                  <label className="block text-base font-bold text-white mb-3 px-2 py-2 bg-purple-600 bg-opacity-20 rounded-lg">
                    🏆 Tournament Name *
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g., Free Fire Squad Championship"
                    className="w-full px-4 py-4 bg-primary-darker border-2 border-purple-500 rounded-lg text-white text-base font-semibold placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500"
                    required 
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Game *</label>
                  <select value={formData.game} onChange={(e) => setFormData({ ...formData, game: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required disabled={showEditModal}>
                    <option value="freefire">Free Fire</option>
                    <option value="bgmi">BGMI</option>
                    <option value="stumbleguys">Stumble Guys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status *</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Prize Pool (₹) *</label>
                  <input type="number" value={formData.prize_pool} onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entry Fee (₹) *</label>
                  <select value={formData.entry_fee} onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required>
                    <option value="0">Free</option>
                    <option value="10">₹10</option>
                    <option value="20">₹20</option>
                    <option value="30">₹30</option>
                    <option value="50">₹50</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Players *</label>
                  <input type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required max="50" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" rows="3" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Rules</label>
                  <textarea value={formData.rules} onChange={(e) => setFormData({ ...formData, rules: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" rows="3" placeholder="One rule per line" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedTournament(null); resetForm(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">
                  {showCreateModal ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{/* PARTICIPANTS MODAL */}
      {showParticipantsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-primary-card rounded-2xl w-full max-w-5xl p-6 md:p-8 border border-white border-opacity-10 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">Participants</h3>
                <p className="text-sm text-gray-400">{selectedTournament.name}</p>
                {selectedTournament.tournament_id && <p className="text-xs font-mono text-purple-400">ID: {selectedTournament.tournament_id}</p>}
              </div>
              <button onClick={() => { setShowParticipantsModal(false); setSelectedTournament(null); setParticipants([]); }} className="text-gray-400 hover:text-white text-3xl">
                <FaTimes />
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
                      <th className="text-left py-3 px-2 md:px-4">Status</th>
                      <th className="text-left py-3 px-2 md:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.sort((a, b) => (a.seat_number || 0) - (b.seat_number || 0)).map((p) => (
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
                        <td className="py-3 px-2 md:px-4">
                          {p.win_tag_given ? (
                            <div>
                              <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded text-xs font-bold">✓ WINNER</span>
                              {p.prize_won > 0 && <p className="text-xs text-green-400 mt-1">₹{p.prize_won}</p>}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-2 md:px-4">
                          {!p.win_tag_given && (
                            <button onClick={() => handleGiveWin(p.user_id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold">
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
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">{participants.filter(p => p.win_tag_given).length}</p>
                      <p className="text-xs text-gray-400">Winners</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">₹{participants.reduce((sum, p) => sum + (p.payment_amount || 0), 0)}</p>
                      <p className="text-xs text-gray-400">Collected</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">₹{participants.reduce((sum, p) => sum + (p.prize_won || 0), 0)}</p>
                      <p className="text-xs text-gray-400">Paid Out</p>
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
              <button onClick={() => { setShowUserManageModal(false); setSelectedUser(null); }} className="text-gray-400 hover:text-white text-3xl">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <FaCoins className="inline mr-1" />
                    Real Money (₹)
                  </label>
                  <input type="number" step="0.01" value={userFormData.wallet_real} onChange={(e) => setUserFormData({ ...userFormData, wallet_real: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Coins 🪙</label>
                  <input type="number" value={userFormData.wallet_coins} onChange={(e) => setUserFormData({ ...userFormData, wallet_coins: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gems 💎</label>
                  <input type="number" value={userFormData.wallet_gems} onChange={(e) => setUserFormData({ ...userFormData, wallet_gems: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <FaBan className="inline mr-1" />
                  Account Status
                </label>
                <select value={userFormData.status} onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })} className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required>
                  <option value="active">Active ✓</option>
                  <option value="suspended">Suspended ⚠️</option>
                  <option value="banned">Banned ❌</option>
                </select>
              </div>

              <div className="bg-white bg-opacity-5 rounded-lg p-4">
                <h4 className="font-bold mb-2">Current Stats</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Wins:</p>
                    <p className="font-bold">{selectedUser.total_wins || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Played:</p>
                    <p className="font-bold">{selectedUser.total_tournaments_played || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Points:</p>
                    <p className="font-bold">{selectedUser.achievement_points || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Level:</p>
                    <p className="font-bold">{selectedUser.level || 1}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowUserManageModal(false); setSelectedUser(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">
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
              <button onClick={() => setShowAnnouncementModal(false)} className="text-gray-400 hover:text-white text-3xl">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input type="text" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} placeholder="Important Update" className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" required maxLength={100} />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Message *</label>
                <textarea value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} placeholder="Enter announcement..." className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500" rows="5" required maxLength={500} />
                <p className="text-xs text-gray-500 mt-1">{announcement.message.length}/500</p>
              </div>

              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">📢 Sends to ALL active users</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAnnouncementModal(false)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
