'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { FaTrophy, FaArrowLeft, FaUsers, FaCoins } from 'react-icons/fa';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, [params.id]);

  const loadTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Tournament not found</p>
        <button onClick={() => router.push('/tournaments')} className="mt-4 text-purple-400 hover:underline">
          Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/tournaments')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-all"
      >
        <FaArrowLeft />
        Back to Tournaments
      </button>

      <div className="bg-primary-card rounded-2xl p-6 md:p-8 border border-white border-opacity-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <p className="text-gray-400">{tournament.game?.toUpperCase()}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            tournament.status === 'live' ? 'bg-red-500 text-white' :
            tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {tournament.status?.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaTrophy className="text-yellow-400 text-2xl mb-2" />
            <p className="text-gray-400 text-sm">Prize Pool</p>
            <p className="text-xl font-bold">₹{tournament.prize_pool}</p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaCoins className="text-green-400 text-2xl mb-2" />
            <p className="text-gray-400 text-sm">Entry Fee</p>
            <p className="text-xl font-bold">₹{tournament.entry_fee}</p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <FaUsers className="text-purple-400 text-2xl mb-2" />
            <p className="text-gray-400 text-sm">Players</p>
            <p className="text-xl font-bold">{tournament.participants_count}/{tournament.max_participants}</p>
          </div>

          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Tournament ID</p>
            <p className="text-sm font-mono text-purple-400">{tournament.tournament_id}</p>
          </div>
        </div>

        {tournament.description && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Description</h3>
            <p className="text-gray-400">{tournament.description}</p>
          </div>
        )}

        {tournament.rules && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Rules</h3>
            <div className="text-gray-400 whitespace-pre-line">{tournament.rules}</div>
          </div>
        )}

        <button
          onClick={() => alert('Join functionality coming soon!')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-all"
        >
          Join Tournament
        </button>
      </div>
    </div>
  );
}
