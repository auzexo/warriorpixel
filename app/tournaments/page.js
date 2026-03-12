'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { formatISTDate } from '@/lib/timeUtils';
import { getEffectiveStatus } from '@/lib/tournamentUtils';
import { FaTrophy, FaClock, FaFire, FaInfoCircle, FaTimes, FaCheckCircle, FaUsers, FaMoneyBillWave, FaSkull, FaCrown } from 'react-icons/fa';

export default function TournamentsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState(null);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState(new Set());
  const [joinData, setJoinData] = useState({
    in_game_name: '',
    in_game_id: ''
  });

  useEffect(() => {
    loadTournaments();
    if (user) {
      loadUserJoinedTournaments();
    }
  }, [filter, user]);

  const loadUserJoinedTournaments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const joinedIds = new Set((data || []).map(p => p.tournament_id));
      setJoinedTournamentIds(joinedIds);
    } catch (error) {
      console.error('Error loading joined tournaments:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      let query = supabase
        .from('tournaments')
        .select('*, preset:tournament_presets(*)')
        .order('start_time', { ascending: true });

      if (filter === 'upcoming') {
        query = query.eq('status', 'upcoming');
      } else if (filter === 'live') {
        query = query.eq('status', 'live');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;

      const tournamentsWithCounts = await Promise.all(
        (data || []).map(async (tournament) => {
          const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          return {
            ...tournament,
            participantCount: count || 0
          };
        })
      );

      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (tournament) => {
    setSelectedTournament(tournament);
    setShowModal(true);

    if (user) {
      const { data } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserParticipation(data);
    } else {
      setUserParticipation(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTournament(null);
    setUserParticipation(null);
    setJoinData({ in_game_name: '', in_game_id: '' });
  };

  const handleJoin = async () => {
    if (!user) {
      alert('Please login to join tournaments');
      router.push('/');
      return;
    }

    if (!joinData.in_game_name || !joinData.in_game_id) {
      alert('Please enter your in-game name and ID');
      return;
    }

    if (!joinData.in_game_name.trim() || !joinData.in_game_id.trim()) {
      alert('In-game name and ID cannot be empty');
      return;
    }

    if (selectedTournament.participantCount >= selectedTournament.max_participants) {
      alert('Tournament is full!');
      return;
    }

    setJoining(true);

    try {
      // Check if already joined
      const { data: existing, error: checkError } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', selectedTournament.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Check error:', checkError);
        throw new Error('Failed to check participation status');
      }

      if (existing) {
        alert('You have already joined this tournament!');
        setJoining(false);
        return;
      }

      const entryFee = parseFloat(selectedTournament.entry_fee || 0);

      // Handle entry fee payment
      if (entryFee > 0) {
        const currentBalance = parseFloat(profile?.wallet_real || 0);
        
        if (currentBalance < entryFee) {
          alert(`Insufficient balance!\n\nRequired: ₹${entryFee.toFixed(2)}\nYour balance: ₹${currentBalance.toFixed(2)}`);
          setJoining(false);
          return;
        }

        // Deduct entry fee
        const newBalance = currentBalance - entryFee;
        
        const { error: walletError } = await supabase
          .from('users')
          .update({ wallet_real: newBalance })
          .eq('id', user.id);

        if (walletError) {
          console.error('Wallet error:', walletError);
          throw new Error('Failed to deduct entry fee');
        }

        // Record transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'tournament_entry',
            amount: -entryFee,
            status: 'completed',
            description: `Entry fee for ${selectedTournament.title}`,
            tournament_id: selectedTournament.id
          });

        if (transactionError) {
          console.error('Transaction error:', transactionError);
          // Refund on error
          await supabase
            .from('users')
            .update({ wallet_real: currentBalance })
            .eq('id', user.id);
          throw new Error('Failed to record transaction');
        }
      }

      // Get next seat number
      const { data: maxSeat } = await supabase
        .from('tournament_participants')
        .select('seat_number')
        .eq('tournament_id', selectedTournament.id)
        .order('seat_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSeatNumber = maxSeat ? maxSeat.seat_number + 1 : 1;

      // Join tournament
      const { error: joinError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: selectedTournament.id,
          user_id: user.id,
          in_game_name: joinData.in_game_name.trim(),
          in_game_id: joinData.in_game_id.trim(),
          seat_number: nextSeatNumber
        });

      if (joinError) {
        console.error('Join error:', joinError);
        
        // Refund if payment was made
        if (entryFee > 0) {
          const currentBalance = parseFloat(profile?.wallet_real || 0);
          await supabase
            .from('users')
            .update({ wallet_real: currentBalance + entryFee })
            .eq('id', user.id);
        }
        
        throw new Error('Failed to join tournament');
      }

      alert(`✅ Successfully joined!\n\nYour Seat: #${nextSeatNumber}\nIn-Game Name: ${joinData.in_game_name}`);
      closeModal();
      await loadTournaments();
      await loadUserJoinedTournaments();
      
    } catch (error) {
      console.error('Join error:', error);
      alert('❌ ' + error.message);
    } finally {
      setJoining(false);
    }
  };

  const getStatusBadge = (status) => {
    const effectiveStatus = getEffectiveStatus({ status, start_time: status.start_time });
    
    switch (effectiveStatus) {
      case 'live':
        return { bg: 'bg-red-600', text: 'LIVE', icon: '🔴' };
      case 'upcoming':
        return { bg: 'bg-blue-600', text: 'UPCOMING', icon: '⏳' };
      case 'completed':
        return { bg: 'bg-gray-600', text: 'COMPLETED', icon: '✅' };
      default:
        return { bg: 'bg-gray-600', text: status.toUpperCase(), icon: '❓' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-discord-text">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <FaTrophy className="text-yellow-400" />
          Tournaments
        </h1>
        <p className="text-discord-text">Join competitive tournaments and win prizes</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-discord-dark text-discord-text hover:bg-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-discord-dark text-discord-text hover:bg-gray-700'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            filter === 'live'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-discord-dark text-discord-text hover:bg-gray-700'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            filter === 'completed'
              ? 'bg-gray-600 text-white shadow-lg'
              : 'bg-discord-dark text-discord-text hover:bg-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => {
          const statusBadge = getStatusBadge(tournament.status);
          const isJoined = joinedTournamentIds.has(tournament.id);
          const spotsLeft = tournament.max_participants - tournament.participantCount;
          
          return (
            <div
              key={tournament.id}
              className={`rounded-xl p-6 transition-all hover:shadow-2xl ${
                isJoined 
                  ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-400 shadow-green-500/20 shadow-xl'
                  : 'bg-discord-dark border border-gray-800 hover:border-purple-600'
              }`}
            >
              {/* Joined Badge */}
              {isJoined && (
                <div className="mb-4 bg-green-500 rounded-lg p-3 flex items-center gap-2 border-2 border-green-300">
                  <FaCheckCircle className="text-2xl text-white" />
                  <div>
                    <p className="font-bold text-white text-lg">JOINED</p>
                    <p className="text-green-100 text-sm">You're registered!</p>
                  </div>
                </div>
              )}

              {/* Tournament Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className={`${statusBadge.bg} px-3 py-1 rounded-lg inline-flex items-center gap-2 mb-2`}>
                    <span>{statusBadge.icon}</span>
                    <span className="text-white font-bold text-sm">{statusBadge.text}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{tournament.title}</h3>
                  <p className="text-discord-text text-sm">{tournament.game}</p>
                </div>
                <FaTrophy className="text-3xl text-yellow-400" />
              </div>

              {/* Preset Badge */}
              {tournament.preset && (
                <div className="mb-4 bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-2 text-center">
                  <p className="text-purple-300 font-semibold text-sm">{tournament.preset.name}</p>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-sm">Prize Pool</span>
                  <span className="text-green-400 font-bold text-lg">₹{tournament.prize_pool}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-sm">Entry Fee</span>
                  <span className="text-white font-bold">
                    {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-sm">Players</span>
                  <span className="text-white font-bold">
                    {tournament.participantCount}/{tournament.max_participants}
                  </span>
                </div>
                {spotsLeft <= 5 && spotsLeft > 0 && (
                  <div className="bg-orange-900 bg-opacity-30 border border-orange-600 rounded p-2">
                    <p className="text-orange-400 text-xs font-bold text-center">
                      ⚠️ Only {spotsLeft} spots left!
                    </p>
                  </div>
                )}
              </div>

              {/* Time - FIXED IST */}
              <div className="bg-discord-darkest rounded-lg p-3 mb-4 flex items-center gap-2">
                <FaClock className="text-cyan-400" />
                <div>
                  <p className="text-xs text-discord-text">Start Time</p>
                  <p className="text-white font-semibold text-sm">
                    {formatISTDate(tournament.start_time, true)}
                  </p>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => viewDetails(tournament)}
                className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  isJoined
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <FaInfoCircle />
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-white font-bold text-xl mb-2">No tournaments found</p>
          <p className="text-discord-text">Check back later for upcoming tournaments</p>
        </div>
      )}

      {/* Modal - Keep existing modal code but fix time display */}
      {showModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-discord-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-discord-dark border-b border-gray-800 p-4 md:p-6 flex items-start justify-between z-10">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedTournament.title}</h2>
                <p className="text-discord-text text-sm md:text-base">{selectedTournament.game}</p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-all flex-shrink-0"
              >
                <FaTimes className="text-2xl text-discord-text hover:text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`${getStatusBadge(selectedTournament.status).bg} px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2`}>
                  <span>{getStatusBadge(selectedTournament.status).icon}</span>
                  {getStatusBadge(selectedTournament.status).text}
                </div>
                {selectedTournament.preset && (
                  <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg px-4 py-2">
                    <p className="text-purple-300 font-semibold text-sm">{selectedTournament.preset.name}</p>
                  </div>
                )}
              </div>

              {/* User Participation Status */}
              {userParticipation && (
                <div className="bg-green-600 bg-opacity-20 border-2 border-green-500 rounded-xl p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FaCheckCircle className="text-3xl text-green-400" />
                    <div>
                      <p className="font-bold text-white text-lg">You're Registered!</p>
                      <p className="text-green-300">Seat #{userParticipation.seat_number}</p>
                    </div>
                  </div>
                  <div className="bg-green-950 bg-opacity-50 rounded-lg p-3">
                    <p className="text-green-200 text-sm">
                      <span className="font-semibold">In-Game Name:</span> {userParticipation.in_game_name}
                    </p>
                    <p className="text-green-200 text-sm mt-1">
                      <span className="font-semibold">In-Game ID:</span> {userParticipation.in_game_id}
                    </p>
                  </div>
                </div>
              )}

              {/* Prize Breakdown */}
              {selectedTournament.preset && (
                <div>
                  <h3 className="font-bold text-white mb-3 text-base md:text-lg">💰 Prize Distribution</h3>
                  <div className="space-y-3">
                    {selectedTournament.preset.preset_number === 6 ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                          <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 text-center border border-yellow-400">
                            <p className="text-2xl mb-1">🥇</p>
                            <p className="text-xs text-yellow-200">1st Place</p>
                            <p className="text-lg font-bold text-white">₹20</p>
                          </div>
                          <div className="bg-gray-400 bg-opacity-20 rounded-lg p-3 text-center border border-gray-400">
                            <p className="text-2xl mb-1">🥈</p>
                            <p className="text-xs text-gray-200">2nd Place</p>
                            <p className="text-lg font-bold text-white">₹15</p>
                          </div>
                          <div className="bg-orange-500 bg-opacity-20 rounded-lg p-3 text-center border border-orange-400">
                            <p className="text-2xl mb-1">🥉</p>
                            <p className="text-xs text-orange-200">3rd Place</p>
                            <p className="text-lg font-bold text-white">₹10</p>
                          </div>
                        </div>
                        <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCrown className="text-yellow-400" />
                            <p className="text-xs text-yellow-200">Booyah Winner Bonus</p>
                          </div>
                          <p className="text-xl font-bold text-white">+₹{selectedTournament.preset.booyah_reward}</p>
                          <p className="text-xs text-yellow-200 mt-1">Win Tag + Additional Prize</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedTournament.preset.per_kill_reward > 0 && (
                          <div className="bg-red-600 bg-opacity-20 rounded-lg p-3 border border-red-400">
                            <div className="flex items-center gap-2 mb-1">
                              <FaSkull className="text-red-400" />
                              <p className="text-xs text-red-200">Per Kill Reward</p>
                            </div>
                            <p className="text-xl font-bold text-white">₹{selectedTournament.preset.per_kill_reward} each</p>
                            <p className="text-xs text-red-200 mt-1">Example: 10 kills = ₹{selectedTournament.preset.per_kill_reward * 10}</p>
                          </div>
                        )}
                        
                        {selectedTournament.preset.booyah_reward > 0 && (
                          <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCrown className="text-yellow-400" />
                              <p className="text-xs text-yellow-200">Booyah Winner (Win Tag)</p>
                            </div>
                            <p className="text-xl font-bold text-white">₹{selectedTournament.preset.booyah_reward}</p>
                            <p className="text-xs text-yellow-200 mt-1">Only 1 person wins the match</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="bg-green-600 bg-opacity-20 rounded-lg p-3 border-2 border-green-400">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMoneyBillWave className="text-green-400" />
                        <p className="text-xs text-green-200">Total Prize Pool</p>
                      </div>
                      <p className="text-3xl font-bold text-white">₹{parseFloat(selectedTournament.prize_pool).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                  <FaUsers className="text-2xl text-blue-400 mb-2" />
                  <p className="text-xs md:text-sm text-discord-text mb-1">Players</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{selectedTournament.participantCount}/{selectedTournament.max_participants}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                  <FaClock className="text-2xl text-purple-400 mb-2" />
                  <p className="text-xs md:text-sm text-discord-text mb-1">Start Time</p>
                  <p className="text-sm md:text-base font-bold text-white">
                    {formatISTDate(selectedTournament.start_time, true)}
                  </p>
                </div>
              </div>

              {selectedTournament.description && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm md:text-base">Description</h3>
                  <p className="text-xs md:text-sm text-discord-text">{selectedTournament.description}</p>
                </div>
              )}

              {selectedTournament.rules && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm md:text-base">Rules</h3>
                  <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                    <pre className="text-discord-text whitespace-pre-wrap text-xs md:text-sm">{selectedTournament.rules}</pre>
                  </div>
                </div>
              )}

              {userParticipation && selectedTournament.room_id && (
                <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-3 md:p-4">
                  <h3 className="font-bold text-white mb-3 text-sm md:text-base">🎮 Room Details</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Room ID</p>
                      <p className="font-mono font-bold text-white text-sm md:text-base break-all">{selectedTournament.room_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Password</p>
                      <p className="font-mono font-bold text-white text-sm md:text-base break-all">{selectedTournament.room_password}</p>
                    </div>
                  </div>
                </div>
              )}

              {!userParticipation && selectedTournament.status === 'upcoming' && (
                <div>
                  <h3 className="font-bold text-white mb-3 text-sm md:text-base">Join Tournament</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm text-discord-text mb-1">In-Game Name *</label>
                      <input
                        type="text"
                        value={joinData.in_game_name}
                        onChange={(e) => setJoinData({...joinData, in_game_name: e.target.value})}
                        placeholder="Your IGN"
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-discord-text mb-1">In-Game ID *</label>
                      <input
                        type="text"
                        value={joinData.in_game_id}
                        onChange={(e) => setJoinData({...joinData, in_game_id: e.target.value})}
                        placeholder="Your UID"
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm md:text-base"
                      />
                    </div>
                    <button
                      onClick={handleJoin}
                      disabled={joining || selectedTournament.participantCount >= selectedTournament.max_participants}
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all text-sm md:text-base flex items-center justify-center gap-2"
                    >
                      {joining ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Joining...
                        </>
                      ) : selectedTournament.participantCount >= selectedTournament.max_participants ? (
                        'Tournament Full'
                      ) : (
                        <>
                          <FaCheckCircle />
                          Join (₹{parseFloat(selectedTournament.entry_fee || 0).toFixed(0)})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedTournament.status === 'live' && !userParticipation && (
                <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 text-center">
                  <FaFire className="text-3xl text-red-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm md:text-base">Tournament is Live</p>
                  <p className="text-xs md:text-sm text-red-400">Registration closed</p>
                </div>
              )}

              {selectedTournament.status === 'completed' && (
                <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-lg p-4 text-center">
                  <FaTrophy className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm md:text-base">Tournament Completed</p>
                  <p className="text-xs md:text-sm text-discord-text">Results finalized</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
