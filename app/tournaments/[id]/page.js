// app/tournaments/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTournamentWithDetails, joinTournament } from '@/lib/database';
import JoinTournamentModal from '@/components/JoinTournamentModal';
import { FaTrophy, FaUsers, FaCalendar, FaClock, FaGamepad, FaTicketAlt, FaLock } from 'react-icons/fa';
import { format } from 'date-fns';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, refreshProfile } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (params.id && userProfile) {
      loadTournament();
    }
  }, [params.id, userProfile]);

  const loadTournament = async () => {
    setLoading(true);
    const result = await getTournamentWithDetails(params.id, userProfile.id);
    if (result.success) {
      setTournament(result.data);
    } else {
      alert('Tournament not found');
      router.push('/tournaments');
    }
    setLoading(false);
  };

  const handleJoin = async (inGameName, voucherType) => {
    setJoining(true);
    const result = await joinTournament(params.id, userProfile.id, inGameName, voucherType);
    
    if (result.success) {
      alert(`✅ Joined successfully!\n🎮 Your Seat: #${result.data.seat_number}\n🎯 IGN: ${inGameName}`);
      setShowJoinModal(false);
      loadTournament();
      refreshProfile();
    } else {
      alert(`❌ ${result.error}`);
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
        <button onClick={() => router.push('/tournaments')} className="btn-primary mt-4">
          Back to Tournaments
        </button>
      </div>
    );
  }

  const getGameName = (game) => {
    const names = { freefire: 'Free Fire', bgmi: 'BGMI', stumbleguys: 'Stumble Guys' };
    return names[game] || game;
  };

  const getStatusColor = (status) => {
    const colors = { live: 'bg-green-500', upcoming: 'bg-blue-500', completed: 'bg-gray-500' };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className={`rounded-2xl p-6 md:p-8 ${
        tournament.game === 'freefire' ? 'bg-gradient-ff' :
        tournament.game === 'bgmi' ? 'bg-gradient-to-br from-red-600 to-orange-600' :
        'bg-gradient-to-br from-purple-600 to-pink-600'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(tournament.status)} mb-3`}>
              {tournament.status?.toUpperCase()}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{tournament.name}</h1>
            <p className="text-white text-opacity-90">{getGameName(tournament.game)}</p>
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            Prize Pool
          </h3>
          <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            ₹{tournament.prize_pool}
          </div>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FaUsers className="text-blue-500" />
            Participants
          </h3>
          <div className="text-4xl font-bold">
            {tournament.participants_count}/{tournament.max_participants}
          </div>
          <div className="mt-2">
            <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(tournament.participants_count / tournament.max_participants) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h3 className="font-bold mb-4 text-xl">Tournament Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <FaCalendar className="text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Date & Time</p>
              <p className="font-semibold">
                {tournament.tournament_date 
                  ? format(new Date(tournament.tournament_date), 'MMM dd, yyyy - HH:mm')
                  : 'TBA'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FaTicketAlt className="text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Entry Fee</p>
              <p className="font-semibold">
                {tournament.entry_fee > 0 ? `₹${tournament.entry_fee}` : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {tournament.description && (
          <div className="mt-6 pt-6 border-t border-white border-opacity-5">
            <h4 className="font-bold mb-2">Description</h4>
            <p className="text-gray-300">{tournament.description}</p>
          </div>
        )}

        {tournament.rules && (
          <div className="mt-6 pt-6 border-t border-white border-opacity-5">
            <h4 className="font-bold mb-2">Rules</h4>
            <p className="text-gray-300 whitespace-pre-line">{tournament.rules}</p>
          </div>
        )}
      </div>

      {/* Room Details (if joined and visible) */}
      {tournament.is_participant && (
        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
            <FaGamepad className="text-blue-400" />
            Your Registration
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Your Seat Number</p>
              <p className="text-2xl font-bold text-purple-400">#{tournament.user_seat_number}</p>
            </div>

            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">In-Game Name</p>
              <p className="text-2xl font-bold text-cyan-400">{tournament.user_in_game_name}</p>
            </div>
          </div>

          {tournament.can_see_room ? (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
              <h4 className="font-bold mb-3 text-green-400">🎮 Room Details (Live Now!)</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Room ID</p>
                  <p className="text-xl font-mono font-bold">{tournament.room_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Password</p>
                  <p className="text-xl font-mono font-bold">{tournament.room_password}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4 flex items-center gap-3">
              <FaLock className="text-yellow-400 text-2xl" />
              <div>
                <p className="font-bold text-yellow-400">Room details will be available 5 minutes before the tournament</p>
                <p className="text-sm text-gray-400 mt-1">Check back closer to the start time</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Join Button */}
      {!tournament.is_participant && tournament.status !== 'completed' && (
        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <button
            onClick={() => setShowJoinModal(true)}
            disabled={tournament.participants_count >= tournament.max_participants}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {tournament.participants_count >= tournament.max_participants 
              ? 'Tournament Full' 
              : `Join Tournament ${tournament.entry_fee > 0 ? `- ₹${tournament.entry_fee}` : '- Free'}`
            }
          </button>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <JoinTournamentModal
          tournament={tournament}
          userProfile={userProfile}
          onJoin={handleJoin}
          onClose={() => setShowJoinModal(false)}
          loading={joining}
        />
      )}
    </div>
  );
      }
