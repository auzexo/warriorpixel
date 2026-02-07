'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { FaTrophy, FaArrowLeft } from 'react-icons/fa';

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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Tournament not found</p>
        <button onClick={() => router.push('/tournaments')} className="text-purple-400 hover:underline">
          Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/tournaments')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <FaArrowLeft />
        Back
      </button>

      <div className="bg-primary-card rounded-2xl p-8 border border-white border-opacity-10">
        <h1 className="text-3xl font-bold mb-4">{tournament.name}</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Prize Pool</p>
            <p className="text-2xl font-bold">₹{tournament.prize_pool}</p>
          </div>
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Entry Fee</p>
            <p className="text-2xl font-bold">₹{tournament.entry_fee}</p>
          </div>
        </div>

        <p className="text-gray-400 mb-4">{tournament.description}</p>

        <button
          onClick={() => alert('Join coming soon')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold"
        >
          Join Tournament
        </button>
      </div>
    </div>
  );
}
