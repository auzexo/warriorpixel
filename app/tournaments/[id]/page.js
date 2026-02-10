'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTournamentById, joinTournament } from '@/lib/database';
import JoinTournamentModal from '@/components/tournament/JoinTournamentModal';
import { FaTrophy, FaUsers, FaCoins, FaClock, FaArrowLeft, FaLock, FaCheckCircle, FaGamepad } from 'react-icons/fa';

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
      alert('Successfully joined tournament!');
    } else {
      alert(result.error || 'Failed to join tournament');
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
        return 'bg-red-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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

  const spotsLeft = tournament.max_participants - tournament.participants_count;
  const isFull = spotsLeft === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/tournaments')}
        className="flex items-center gap-2 text-discord-text hover:text-white transition-colors"
      >
        <FaArrowLeft />
        Back to Tournaments
      </button>

      {/* Main Card */}
      <div className="bg-discord-dark rounded-xl p-6 md:p-8 border border-gray-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{tournament.name}</h1>
            <p className="text-discord-text uppercase text-sm">{tournament.game}</p>
          </div>
          <div className={`${getStatusColor(tournament.status)} px-4 py-2 rounded-lg text-white font-bold uppercase mt-4 md:mt-0 inline-block`}>
            {tournament.status}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaTrophy className="text-yellow-400 text-2xl mb-2" />
            <p className="text-xs text-discord-text mb-1">Prize Pool</p>
            <p className="text-xl font-bold text-white">₹{tournament.prize_pool}</p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaCoins className="text-green-400 text-2xl mb-2" />
            <p className="text-xs text-discord-text mb-1">Entry Fee</p>
            <p className="text-xl font-bold text-white">
              {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
            </p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaUsers className="text-purple-400 text-2xl mb-2" />
            <p className="text-xs text-discord-text mb-1">Players</p>
            <p className="text-xl font-bold text-white">
              {tournament.participants_count}/{tournament.max_participants}
            </p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaClock className="text-cyan-400 text-2xl mb-2" />
            <p className="text-xs text-discord-text mb-1">Tournament ID</p>
            <p className="text-sm font-mono text-purple-400">{tournament.tournament_id}</p>
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="mb-6">
            <h3 className="font-bold text-lg text-white mb-2">Description</h3>
            <p className="text-discord-text whitespace-pre-line">{tournament.description}</p>
          </div>
        )}

        {/* Rules */}
        {tournament.rules && (
          <div className="mb-6">
            <h3 className="font-bold text-lg text-white mb-2">Rules</h3>
            <div className="text-discord-text whitespace-pre-line bg-white bg-opacity-5 rounded-lg p-4">
              {tournament.rules}
            </div>
          </div>
        )}

        {/* Start Time */}
        <div className="mb-6 bg-white bg-opacity-5 rounded-lg p-4">
          <h3 className="font-bold text-white mb-2">Tournament Schedule</h3>
          <p className="text-discord-text flex items-center gap-2">
            <FaClock className="text-cyan-400" />
            {formatDate(tournament.start_time)}
          </p>
        </div>

        {/* Room Details (if participant and room visible) */}
        {tournament.is_participant && tournament.can_see_room && (
          <div className="mb-6 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <FaGamepad className="text-green-400" />
              Room Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-discord-text">Room ID:</span>
                <span className="font-mono font-bold text-white">{tournament.room_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-discord-text">Password:</span>
                <span className="font-mono font-bold text-white">{tournament.room_password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-discord-text">Your Seat:</span>
                <span className="font-bold text-green-400">#{tournament.user_seat_number}</span>
              </div>
            </div>
          </div>
        )}

        {/* Room Locked (if participant but room not visible yet) */}
        {tournament.is_participant && !tournament.can_see_room && (
          <div className="mb-6 bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaLock className="text-orange-400" />
              <h3 className="font-bold text-white">Room Details Locked</h3>
            </div>
            <p className="text-discord-text text-sm">
              Room ID and password will be visible 5 minutes before tournament starts.
            </p>
            <p className="text-orange-400 text-sm mt-2">Your Seat: #{tournament.user_seat_number}</p>
          </div>
        )}

        {/* Join Button or Status */}
        {tournament.is_participant ? (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4 flex items-center gap-3">
            <FaCheckCircle className="text-green-400 text-2xl" />
            <div>
              <p className="font-bold text-white">You're Registered!</p>
              <p className="text-sm text-discord-text">Seat #{tournament.user_seat_number}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowJoinModal(true)}
            disabled={isFull || tournament.status !== 'upcoming'}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              isFull || tournament.status !== 'upcoming'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isFull ? 'Tournament Full' : tournament.status !== 'upcoming' ? 'Registration Closed' : 'Join Tournament'}
          </button>
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
