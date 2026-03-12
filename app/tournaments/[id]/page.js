'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTournamentById, joinTournament } from '@/lib/database';
import { getEffectiveStatus, canJoinTournament } from '@/lib/tournamentUtils';
import JoinTournamentModal from '@/components/tournament/JoinTournamentModal';
import { FaTrophy, FaUsers, FaCoins, FaClock, FaArrowLeft, FaLock, FaCheckCircle, FaGamepad, FaCrown, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadTournament();
  }, [params.id, user]);

  const loadTournament = async () => {
    setLoading(true);
    const result = await getTournamentById(params.id, user?.id);
    if (result.success) {
      setTournament(result.data);
    }
    setLoading(false);
  };

  const handleJoin = async (inGameName, voucherType) => {
    if (!user) {
      alert('Please login to join tournaments');
      return;
    }

    setJoining(true);
    const result = await joinTournament(params.id, user.id, inGameName, voucherType);
    
    if (result.success) {
      setShowJoinModal(false);
      await loadTournament();
      await refreshProfile();
      alert('✅ Successfully joined tournament!');
    } else {
      alert('❌ ' + (result.error || 'Failed to join tournament'));
    }
    setJoining(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-600';
      case 'upcoming':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return { color: 'red', icon: '🔴', text: 'LIVE NOW' };
      case 'upcoming':
        return { color: 'blue', icon: '⏳', text: 'UPCOMING' };
      case 'completed':
        return { color: 'gray', icon: '✅', text: 'COMPLETED' };
      default:
        return { color: 'gray', icon: '❓', text: 'UNKNOWN' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-discord-text">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-discord-text mb-4">Tournament not found</p>
        <button onClick={() => router.push('/tournaments')} className="text-purple-400 hover:underline">
          Back to Tournaments
        </button>
      </div>
    );
  }

  // Calculate effective status (auto-switch to live if started)
  const effectiveStatus = getEffectiveStatus(tournament);
  const statusBadge = getStatusBadge(effectiveStatus);
  
  const spotsLeft = tournament.max_participants - tournament.participants_count;
  const isFull = spotsLeft === 0;
  
  // Check if user can join
  const joinCheck = canJoinTournament(
    { ...tournament, status: effectiveStatus }, 
    tournament.participants_count
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/tournaments')}
        className="flex items-center gap-2 text-discord-text hover:text-white transition-colors font-semibold"
      >
        <FaArrowLeft />
        Back to Tournaments
      </button>

      {/* JOINED BANNER - HIGHLY VISIBLE */}
      {tournament.is_participant && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 border-2 border-green-400 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <FaCheckCircle className="text-4xl text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                You're Registered! <FaCrown className="text-yellow-300" />
              </h2>
              <p className="text-green-100 text-lg font-semibold">
                Seat #{tournament.user_seat_number} • {tournament.name}
              </p>
            </div>
          </div>
          
          {effectiveStatus === 'upcoming' && (
            <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
              <p className="text-white text-sm flex items-center gap-2">
                <FaInfoCircle />
                Room details will be visible 5 minutes before tournament starts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-discord-dark rounded-xl p-6 md:p-8 border border-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <FaTrophy className="text-4xl text-yellow-400" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">{tournament.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-900 bg-opacity-30 border border-purple-600 text-purple-300 rounded-full text-sm font-semibold flex items-center gap-1">
                <FaGamepad />
                {tournament.game}
              </span>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm font-mono">
                ID: {tournament.tournament_id}
              </span>
            </div>
          </div>
          <div className={`${getStatusColor(effectiveStatus)} px-6 py-3 rounded-xl text-white font-bold uppercase shadow-lg flex items-center gap-2 text-lg`}>
            <span className="text-2xl">{statusBadge.icon}</span>
            {statusBadge.text}
          </div>
        </div>

        {/* Auto-Status Warning */}
        {tournament.status === 'upcoming' && effectiveStatus === 'live' && (
          <div className="mb-6 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400 text-xl" />
              <p className="text-red-300 font-semibold">
                Tournament has started! Registration is now closed.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-600 rounded-xl p-5">
            <FaTrophy className="text-yellow-300 text-3xl mb-2" />
            <p className="text-xs text-yellow-200 mb-1">Prize Pool</p>
            <p className="text-2xl font-bold text-white">₹{tournament.prize_pool}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-5">
            <FaCoins className="text-green-300 text-3xl mb-2" />
            <p className="text-xs text-green-200 mb-1">Entry Fee</p>
            <p className="text-2xl font-bold text-white">
              {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-5">
            <FaUsers className="text-purple-300 text-3xl mb-2" />
            <p className="text-xs text-purple-200 mb-1">Players</p>
            <p className="text-2xl font-bold text-white">
              {tournament.participants_count}/{tournament.max_participants}
            </p>
            <div className="mt-2 bg-purple-950 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-purple-400 h-full transition-all"
                style={{ width: `${(tournament.participants_count / tournament.max_participants) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 border border-cyan-600 rounded-xl p-5">
            <FaClock className="text-cyan-300 text-3xl mb-2" />
            <p className="text-xs text-cyan-200 mb-1">Spots Left</p>
            <p className="text-2xl font-bold text-white">{spotsLeft}</p>
            {isFull && <p className="text-xs text-red-400 mt-1 font-semibold">FULL!</p>}
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="mb-6">
            <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
              📋 Description
            </h3>
            <div className="bg-discord-darkest border border-gray-700 rounded-lg p-4">
              <p className="text-discord-text whitespace-pre-line leading-relaxed">{tournament.description}</p>
            </div>
          </div>
        )}

        {/* Rules */}
        {tournament.rules && (
          <div className="mb-6">
            <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
              📜 Tournament Rules
            </h3>
            <div className="bg-discord-darkest border border-gray-700 rounded-lg p-5">
              <pre className="text-discord-text whitespace-pre-line font-sans leading-relaxed">
                {tournament.rules}
              </pre>
            </div>
          </div>
        )}

        {/* Start Time */}
        <div className="mb-6 bg-gradient-to-br from-blue-900 to-indigo-900 border border-blue-600 rounded-xl p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-lg">
            <FaClock className="text-blue-300" />
            Tournament Schedule
          </h3>
          <p className="text-blue-100 text-lg font-semibold">
            {formatDate(tournament.start_time)}
          </p>
        </div>

        {/* Room Details (if participant and room visible) */}
        {tournament.is_participant && tournament.can_see_room && (
          <div className="mb-6 bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-500 rounded-xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
              <FaGamepad className="text-green-300 text-2xl" />
              Room Details
            </h3>
            <div className="space-y-4">
              <div className="bg-green-950 bg-opacity-50 rounded-lg p-4">
                <p className="text-green-300 text-sm mb-1">Room ID</p>
                <p className="font-mono font-bold text-white text-2xl tracking-wide">{tournament.room_id}</p>
              </div>
              <div className="bg-green-950 bg-opacity-50 rounded-lg p-4">
                <p className="text-green-300 text-sm mb-1">Password</p>
                <p className="font-mono font-bold text-white text-2xl tracking-wide">{tournament.room_password}</p>
              </div>
              <div className="bg-green-950 bg-opacity-50 rounded-lg p-4">
                <p className="text-green-300 text-sm mb-1">Your Seat Number</p>
                <p className="font-bold text-green-400 text-3xl">#{tournament.user_seat_number}</p>
              </div>
            </div>
            <div className="mt-4 bg-green-950 bg-opacity-30 rounded-lg p-3">
              <p className="text-green-200 text-sm flex items-center gap-2">
                <FaInfoCircle />
                Join the game room using these details at the scheduled time
              </p>
            </div>
          </div>
        )}

        {/* Room Locked (if participant but room not visible yet) */}
        {tournament.is_participant && !tournament.can_see_room && (
          <div className="mb-6 bg-gradient-to-br from-orange-900 to-yellow-900 border-2 border-orange-500 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaLock className="text-orange-300 text-2xl" />
              <h3 className="font-bold text-white text-xl">Room Details Locked</h3>
            </div>
            <p className="text-orange-100 mb-3">
              Room ID and password will be visible 5 minutes before tournament starts.
            </p>
            <div className="bg-orange-950 bg-opacity-50 rounded-lg p-4">
              <p className="text-orange-200 text-sm mb-1">Your Seat Number</p>
              <p className="text-orange-400 font-bold text-2xl">#{tournament.user_seat_number}</p>
            </div>
          </div>
        )}

        {/* Join Button or Status */}
        {tournament.is_participant ? (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-400 rounded-xl p-6 flex items-center gap-4 shadow-lg">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-white text-3xl" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-xl mb-1">You're All Set!</p>
              <p className="text-green-100">
                Registered for Seat #{tournament.user_seat_number}
              </p>
            </div>
            <FaCrown className="text-yellow-300 text-4xl" />
          </div>
        ) : (
          <div>
            {!joinCheck.canJoin && (
              <div className="mb-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-400" />
                  <p className="text-red-300 font-semibold">{joinCheck.reason}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowJoinModal(true)}
              disabled={!joinCheck.canJoin}
              className={`w-full py-5 rounded-xl font-bold text-xl transition-all shadow-lg ${
                !joinCheck.canJoin
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-2 border-gray-600'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-2 border-purple-400'
              }`}
            >
              {isFull ? '🚫 Tournament Full' : 
               effectiveStatus === 'live' ? '🔒 Registration Closed - Tournament Started' :
               effectiveStatus === 'completed' ? '✅ Tournament Ended' :
               '🎮 Join Tournament'}
            </button>
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <JoinTournamentModal
          tournament={tournament}
          userProfile={profile}
          onJoin={handleJoin}
          onClose={() => setShowJoinModal(false)}
          loading={joining}
        />
      )}
    </div>
  );
}
