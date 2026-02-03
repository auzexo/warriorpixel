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
    setFormData({
      name: tournament.name,
      game: tournament.game,
      status: tournament.status,
      prize_pool: tournament.prize_pool.toString(),
      entry_fee: tournament.entry_fee.toString(),
      max_participants: tournament.max_participants.toString(),
      tournament_date: tournament.tournament_date ? tournament.tournament_date.slice(0, 16) : '',
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
