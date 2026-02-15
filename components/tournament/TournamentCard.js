'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaTrophy, FaUsers, FaClock, FaMoneyBillWave } from 'react-icons/fa';

export default function TournamentCard({ tournament, onJoinClick, user, profile }) {
  const [participantCount, setParticipantCount] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipantData();
  }, [tournament.id, user]);

  const loadParticipantData = async () => {
    try {
      // Count participants directly
      const { count, error } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id);

      if (error) throw error;

      console.log(`Tournament ${tournament.title}: ${count} participants`);
      setParticipantCount(count || 0);

      // Check if current user has joined
      if (user) {
        const { data: userParticipation } = await supabase
          .from('tournament_participants')
          .select('id')
          .eq('tournament_id', tournament.id)
          .eq('user_id', user.id)
          .single();

        setIsJoined(!!userParticipation);
      }
    } catch (error) {
      console.error('Error loading participant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFull = participantCount >= tournament.max_participants;
  const canJoin = user && !isJoined && !isFull && tournament.status === 'upcoming';

  return (
    <div className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-red-500 transition-all">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
          tournament.status === 'live' ? 'bg-green-500 text-white animate-pulse' :
          'bg-gray-500 text-white'
        }`}>
          {tournament.status === 'upcoming' ? '🕒 UPCOMING' :
           tournament.status === 'live' ? '🔴 LIVE NOW' :
           '✓ COMPLETED'}
        </span>
        {isJoined && (
          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
            ✓ JOINED
          </span>
        )}
      </div>

      {/* Tournament Title */}
      <h3 className="text-2xl font-bold text-white mb-2">{tournament.title}</h3>
      <p className="text-discord-text mb-4">{tournament.game}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaUsers className="text-purple-400" />
            <p className="text-xs text-discord-text">Players</p>
          </div>
          <p className="text-white font-bold">
            {loading ? '...' : `${participantCount}/${tournament.max_participants}`}
          </p>
          {isFull && <p className="text-red-400 text-xs mt-1">FULL</p>}
        </div>

        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaTrophy className="text-yellow-400" />
            <p className="text-xs text-discord-text">Prize Pool</p>
          </div>
          <p className="text-white font-bold">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
        </div>

        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaMoneyBillWave className="text-green-400" />
            <p className="text-xs text-discord-text">Entry Fee</p>
          </div>
          <p className="text-white font-bold">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
        </div>

        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaClock className="text-blue-400" />
            <p className="text-xs text-discord-text">Starts</p>
          </div>
          <p className="text-white font-bold text-xs">
            {new Date(tournament.start_time).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Description */}
      {tournament.description && (
        <p className="text-discord-text text-sm mb-4 line-clamp-2">
          {tournament.description}
        </p>
      )}

      {/* Join Button */}
      {canJoin ? (
        <button
          onClick={() => onJoinClick(tournament)}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all"
        >
          Join Tournament
        </button>
      ) : isFull ? (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 py-3 rounded-lg font-bold cursor-not-allowed"
        >
          Tournament Full
        </button>
      ) : isJoined ? (
        <button
          disabled
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold cursor-default"
        >
          Already Joined
        </button>
      ) : !user ? (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 py-3 rounded-lg font-bold cursor-not-allowed"
        >
          Login to Join
        </button>
      ) : (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 py-3 rounded-lg font-bold cursor-not-allowed"
        >
          {tournament.status === 'completed' ? 'Tournament Ended' : 'Cannot Join'}
        </button>
      )}
    </div>
  );
            }
