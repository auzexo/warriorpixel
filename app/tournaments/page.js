'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useBanCheck } from '@/hooks/useBanCheck';
import { useRouter } from 'next/navigation';
import { formatISTDate } from '@/lib/timeUtils';
import { updateTournamentStatuses } from '@/lib/tournamentStatusUpdater';
import { FaTrophy, FaClock, FaFire, FaInfoCircle, FaTimes, FaCheckCircle, FaUsers, FaMoneyBillWave, FaSkull, FaCrown, FaBan, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

export default function TournamentsPage() {
  const { user, profile } = useAuth();
  const { banStatus, loading: banLoading, checked: banChecked } = useBanCheck();
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
      // FIRST: Auto-update tournament statuses
      await updateTournamentStatuses();

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
    // Banned users can view but not join
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
    // BAN CHECK: Prevent banned/suspended users from joining
    if (banStatus) {
      alert(`❌ Cannot Join Tournament\n\nYour account is currently ${banStatus.ban_type === 'permanent' ? 'banned' : 'suspended'}.\n\nReason: ${banStatus.reason}\n\nYou cannot participate in tournaments at this time.`);
      return;
    }

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

    // Check if tournament is still upcoming
    if (selectedTournament.status !== 'upcoming') {
      alert('Cannot join: Tournament has already started or ended!');
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
    switch (status) {
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

  // Show loading while checking ban status
  if (banLoading || !banChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-discord-text">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Show ban warning if user is banned
  if (banStatus) {
    return (
      <div className="w-full max-w-6xl mx-auto px-3">
        {/* Ban Warning */}
        <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FaBan className="text-4xl text-red-400 flex-shrink-0 mt-1 animate-pulse" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">
                {banStatus.ban_type === 'permanent' ? '🚫 Account Banned' : '⏸️ Account Suspended'}
              </h2>
              <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 mb-4">
                <p className="text-red-300 mb-2"><strong>Reason:</strong> {banStatus.reason}</p>
                {banStatus.ban_type === 'temporary' && banStatus.expires_at && (
                  <p className="text-red-300">
                    <strong>Expires:</strong> {formatISTDate(banStatus.expires_at, true)}
                  </p>
                )}
              </div>
              <p className="text-discord-text mb-4">
                You can browse tournaments but cannot join them while your account has restricted access.
              </p>
              <Link 
                href="/restricted"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all"
              >
                <FaInfoCircle />
                View Restriction Details
              </Link>
            </div>
          </div>
        </div>

        {/* Tournament list (view only) - continues below... */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <FaTrophy className="text-yellow-400" />
            Tournaments (View Only)
          </h1>
          <p className="text-discord-text text-sm">You can view tournaments but cannot participate</p>
        </div>

        {/* Rest of tournament display continues normally... */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-discord-text">Loading tournaments...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-3 px-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-discord-dark text-discord-text'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-discord-dark text-discord-text'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === 'live'
                    ? 'bg-red-600 text-white'
                    : 'bg-discord-dark text-discord-text'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === 'completed'
                    ? 'bg-gray-600 text-white'
                    : 'bg-discord-dark text-discord-text'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Tournament Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tournaments.map((tournament) => {
                const statusBadge = getStatusBadge(tournament.status);
                const isJoined = joinedTournamentIds.has(tournament.id);
                const spotsLeft = tournament.max_participants - tournament.participantCount;
                
                return (
                  <div
                    key={tournament.id}
                    className={`rounded-xl p-3 transition-all max-w-full overflow-hidden opacity-60 ${
                      isJoined 
                        ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-400'
                        : 'bg-discord-dark border border-gray-800'
                    }`}
                  >
                    {/* Same card content as original, just with opacity-60 for disabled state */}
                    {isJoined && (
                      <div className="mb-2 bg-green-500 rounded-lg p-2 flex items-center gap-2 border border-green-300">
                        <FaCheckCircle className="text-base text-white flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-xs">JOINED</p>
                          <p className="text-green-100 text-xs truncate">Registered!</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`${statusBadge.bg} px-2 py-0.5 rounded inline-flex items-center gap-1 mb-1.5`}>
                          <span className="text-xs">{statusBadge.icon}</span>
                          <span className="text-white font-bold text-xs">{statusBadge.text}</span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-0.5 break-words line-clamp-2 leading-tight">{tournament.title}</h3>
                        <p className="text-discord-text text-xs truncate">{tournament.game}</p>
                      </div>
                      <FaTrophy className="text-xl text-yellow-400 flex-shrink-0" />
                    </div>

                    {tournament.preset && (
                      <div className="mb-2 bg-purple-900 bg-opacity-30 border border-purple-600 rounded p-1 text-center">
                        <p className="text-purple-300 font-semibold text-xs truncate">{tournament.preset.name}</p>
                      </div>
                    )}

                    <div className="space-y-1.5 mb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-discord-text text-xs">Prize</span>
                        <span className="text-green-400 font-bold text-sm">₹{tournament.prize_pool}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-discord-text text-xs">Entry</span>
                        <span className="text-white font-bold text-xs">
                          {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-discord-text text-xs">Players</span>
                        <span className="text-white font-bold text-xs">
                          {tournament.participantCount}/{tournament.max_participants}
                        </span>
                      </div>
                    </div>

                    <div className="bg-discord-darkest rounded p-2 mb-2">
                      <div className="flex items-start gap-1.5">
                        <FaClock className="text-cyan-400 flex-shrink-0 mt-0.5 text-xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-discord-text mb-0.5">Start</p>
                          <p className="text-white font-semibold text-xs break-words leading-tight">
                            {formatISTDate(tournament.start_time, true)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => viewDetails(tournament)}
                      className="w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <FaInfoCircle className="text-xs" />
                      View Only
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
          </>
        )}
      </div>
    );
  }

  // NORMAL ACCESS (User not banned/suspended) - Show full functionality
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
    <div className="w-full max-w-6xl mx-auto px-3">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <FaTrophy className="text-yellow-400" />
          Tournaments
        </h1>
        <p className="text-discord-text text-sm">Join competitive tournaments and win prizes</p>
      </div>

      {/* Filters - MOBILE OPTIMIZED */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-3 px-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-discord-dark text-discord-text'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-discord-dark text-discord-text'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
            filter === 'live'
              ? 'bg-red-600 text-white'
              : 'bg-discord-dark text-discord-text'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
            filter === 'completed'
              ? 'bg-gray-600 text-white'
              : 'bg-discord-dark text-discord-text'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tournament Cards - ULTRA COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tournaments.map((tournament) => {
          const statusBadge = getStatusBadge(tournament.status);
          const isJoined = joinedTournamentIds.has(tournament.id);
          const spotsLeft = tournament.max_participants - tournament.participantCount;
          
          return (
            <div
              key={tournament.id}
              className={`rounded-xl p-3 transition-all max-w-full overflow-hidden ${
                isJoined 
                  ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-400'
                  : 'bg-discord-dark border border-gray-800'
              }`}
            >
              {/* Joined Badge - ULTRA COMPACT */}
              {isJoined && (
                <div className="mb-2 bg-green-500 rounded-lg p-2 flex items-center gap-2 border border-green-300">
                  <FaCheckCircle className="text-base text-white flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-xs">JOINED</p>
                    <p className="text-green-100 text-xs truncate">Registered!</p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <div className={`${statusBadge.bg} px-2 py-0.5 rounded inline-flex items-center gap-1 mb-1.5`}>
                    <span className="text-xs">{statusBadge.icon}</span>
                    <span className="text-white font-bold text-xs">{statusBadge.text}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-0.5 break-words line-clamp-2 leading-tight">{tournament.title}</h3>
                  <p className="text-discord-text text-xs truncate">{tournament.game}</p>
                </div>
                <FaTrophy className="text-xl text-yellow-400 flex-shrink-0" />
              </div>

              {/* Preset Badge */}
              {tournament.preset && (
                <div className="mb-2 bg-purple-900 bg-opacity-30 border border-purple-600 rounded p-1 text-center">
                  <p className="text-purple-300 font-semibold text-xs truncate">{tournament.preset.name}</p>
                </div>
              )}

              {/* Stats - ULTRA COMPACT */}
              <div className="space-y-1.5 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-xs">Prize</span>
                  <span className="text-green-400 font-bold text-sm">₹{tournament.prize_pool}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-xs">Entry</span>
                  <span className="text-white font-bold text-xs">
                    {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-discord-text text-xs">Players</span>
                  <span className="text-white font-bold text-xs">
                    {tournament.participantCount}/{tournament.max_participants}
                  </span>
                </div>
                {spotsLeft <= 5 && spotsLeft > 0 && (
                  <div className="bg-orange-900 bg-opacity-30 border border-orange-600 rounded p-1">
                    <p className="text-orange-400 text-xs font-bold text-center">
                      ⚠️ {spotsLeft} left!
                    </p>
                  </div>
                )}
              </div>

              {/* Time - ULTRA COMPACT */}
              <div className="bg-discord-darkest rounded p-2 mb-2">
                <div className="flex items-start gap-1.5">
                  <FaClock className="text-cyan-400 flex-shrink-0 mt-0.5 text-xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-discord-text mb-0.5">Start</p>
                    <p className="text-white font-semibold text-xs break-words leading-tight">
                      {formatISTDate(tournament.start_time, true)}
                    </p>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => viewDetails(tournament)}
                className={`w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isJoined
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <FaInfoCircle className="text-xs" />
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

      {/* Modal - CONTINUES WITH SAME MODAL CODE AS ORIGINAL... */}
      {showModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3" onClick={closeModal}>
          <div className="bg-discord-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-discord-dark border-b border-gray-800 p-4 flex items-start justify-between z-10">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 break-words">{selectedTournament.title}</h2>
                <p className="text-discord-text text-sm">{selectedTournament.game}</p>
              </div>
              <button
                onClick={closeModal}
                className="flex-shrink-0 p-2 hover:bg-gray-700 rounded-lg transition-all"
              >
                <FaTimes className="text-xl text-discord-text hover:text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`${getStatusBadge(selectedTournament.status).bg} px-3 py-1.5 rounded-lg font-bold text-white flex items-center gap-2`}>
                  <span>{getStatusBadge(selectedTournament.status).icon}</span>
                  <span className="text-sm">{getStatusBadge(selectedTournament.status).text}</span>
                </div>
                {selectedTournament.preset && (
                  <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg px-3 py-1.5">
                    <p className="text-purple-300 font-semibold text-sm">{selectedTournament.preset.name}</p>
                  </div>
                )}
              </div>

              {/* User Participation Status */}
              {userParticipation && (
                <div className="bg-green-600 bg-opacity-20 border-2 border-green-500 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FaCheckCircle className="text-2xl text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base">You're Registered!</p>
                      <p className="text-green-300 text-sm">Seat #{userParticipation.seat_number}</p>
                    </div>
                  </div>
                  <div className="bg-green-950 bg-opacity-50 rounded-lg p-3">
                    <p className="text-green-200 text-sm break-words">
                      <span className="font-semibold">In-Game Name:</span> {userParticipation.in_game_name}
                    </p>
                    <p className="text-green-200 text-sm mt-1 break-all">
                      <span className="font-semibold">In-Game ID:</span> {userParticipation.in_game_id}
                    </p>
                  </div>
                </div>
              )}

              {/* Prize Breakdown */}
              {selectedTournament.preset && (
                <div>
                  <h3 className="font-bold text-white mb-3 text-base">💰 Prize Distribution</h3>
                  <div className="space-y-3">
                    {selectedTournament.preset.preset_number === 6 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-2 text-center border border-yellow-400">
                            <p className="text-xl mb-0.5">🥇</p>
                            <p className="text-xs text-yellow-200">1st</p>
                            <p className="text-base font-bold text-white">₹20</p>
                          </div>
                          <div className="bg-gray-400 bg-opacity-20 rounded-lg p-2 text-center border border-gray-400">
                            <p className="text-xl mb-0.5">🥈</p>
                            <p className="text-xs text-gray-200">2nd</p>
                            <p className="text-base font-bold text-white">₹15</p>
                          </div>
                          <div className="bg-orange-500 bg-opacity-20 rounded-lg p-2 text-center border border-orange-400">
                            <p className="text-xl mb-0.5">🥉</p>
                            <p className="text-xs text-orange-200">3rd</p>
                            <p className="text-base font-bold text-white">₹10</p>
                          </div>
                        </div>
                        <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCrown className="text-yellow-400" />
                            <p className="text-xs text-yellow-200">Booyah Winner Bonus</p>
                          </div>
                          <p className="text-lg font-bold text-white">+₹{selectedTournament.preset.booyah_reward}</p>
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
                            <p className="text-lg font-bold text-white">₹{selectedTournament.preset.per_kill_reward} each</p>
                            <p className="text-xs text-red-200 mt-1">Example: 10 kills = ₹{selectedTournament.preset.per_kill_reward * 10}</p>
                          </div>
                        )}
                        
                        {selectedTournament.preset.booyah_reward > 0 && (
                          <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCrown className="text-yellow-400" />
                              <p className="text-xs text-yellow-200">Booyah Winner (Win Tag)</p>
                            </div>
                            <p className="text-lg font-bold text-white">₹{selectedTournament.preset.booyah_reward}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="bg-green-600 bg-opacity-20 rounded-lg p-3 border-2 border-green-400">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMoneyBillWave className="text-green-400" />
                        <p className="text-xs text-green-200">Total Prize Pool</p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{parseFloat(selectedTournament.prize_pool).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-discord-darkest rounded-lg p-3">
                  <FaUsers className="text-xl text-blue-400 mb-2" />
                  <p className="text-xs text-discord-text mb-1">Players</p>
                  <p className="text-lg font-bold text-white">{selectedTournament.participantCount}/{selectedTournament.max_participants}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3">
                  <FaClock className="text-xl text-purple-400 mb-2" />
                  <p className="text-xs text-discord-text mb-1">Start Time</p>
                  <p className="text-sm font-bold text-white break-words">
                    {formatISTDate(selectedTournament.start_time, true)}
                  </p>
                </div>
              </div>

              {selectedTournament.description && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm">Description</h3>
                  <p className="text-xs text-discord-text break-words">{selectedTournament.description}</p>
                </div>
              )}

              {selectedTournament.rules && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm">Rules</h3>
                  <div className="bg-discord-darkest rounded-lg p-3">
                    <pre className="text-discord-text whitespace-pre-wrap text-xs break-words font-sans">{selectedTournament.rules}</pre>
                  </div>
                </div>
              )}

              {userParticipation && selectedTournament.room_id && (
                <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-3">
                  <h3 className="font-bold text-white mb-3 text-sm">🎮 Room Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Room ID</p>
                      <p className="font-mono font-bold text-white text-sm break-all">{selectedTournament.room_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Password</p>
                      <p className="font-mono font-bold text-white text-sm break-all">{selectedTournament.room_password}</p>
                    </div>
                  </div>
                </div>
              )}

              {!userParticipation && selectedTournament.status === 'upcoming' && (
                <div>
                  <h3 className="font-bold text-white mb-3 text-sm">Join Tournament</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-discord-text mb-1">In-Game Name *</label>
                      <input
                        type="text"
                        value={joinData.in_game_name}
                        onChange={(e) => setJoinData({...joinData, in_game_name: e.target.value})}
                        placeholder="Your IGN"
                        className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-discord-text mb-1">In-Game ID *</label>
                      <input
                        type="text"
                        value={joinData.in_game_id}
                        onChange={(e) => setJoinData({...joinData, in_game_id: e.target.value})}
                        placeholder="Your UID"
                        className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleJoin}
                      disabled={joining || selectedTournament.participantCount >= selectedTournament.max_participants}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {joining ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                  <FaFire className="text-2xl text-red-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm">Tournament is Live</p>
                  <p className="text-xs text-red-400">Registration closed</p>
                </div>
              )}

              {selectedTournament.status === 'completed' && (
                <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-lg p-4 text-center">
                  <FaTrophy className="text-2xl text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm">Tournament Completed</p>
                  <p className="text-xs text-discord-text">Results finalized</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
