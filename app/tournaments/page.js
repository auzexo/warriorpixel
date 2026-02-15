'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import TournamentCard from '@/components/tournament/TournamentCard';
import JoinTournamentModal from '@/components/tournament/JoinTournamentModal';
import { FaTrophy, FaFilter } from 'react-icons/fa';

export default function TournamentsPage() {
  const { user, profile } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadTournaments();

    // Subscribe to real-time changes in tournament_participants
    const channel = supabase
      .channel('tournament-participants-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_participants'
        },
        (payload) => {
          console.log('Participant change detected:', payload);
          // Reload tournaments to update counts
          loadTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTournaments = async () => {
    setLoading(true);

    try {
      // Load tournaments with participant count
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id
          )
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;

      console.log('Loaded tournaments:', data?.length);

      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (tournament) => {
    setSelectedTournament(tournament);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    setSelectedTournament(null);
    loadTournaments(); // Reload to update counts
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesGame = gameFilter === 'all' || tournament.game === gameFilter;
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    return matchesGame && matchesStatus;
  });

  // Get unique games for filter
  const games = [...new Set(tournaments.map(t => t.game))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <FaTrophy className="text-red-500" />
          Tournaments
        </h1>
        <p className="text-discord-text">
          Join exciting tournaments and win amazing prizes!
        </p>
      </div>

      {/* Filters */}
      <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <FaFilter className="text-purple-400" />
          <h3 className="font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Games</option>
            {games.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live Now</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-discord-text mt-4">Loading tournaments...</p>
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onJoinClick={handleJoinClick}
              user={user}
              profile={profile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-discord-dark rounded-xl border border-gray-800">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-discord-text text-lg mb-2">No tournaments found</p>
          <p className="text-discord-text text-sm">
            {gameFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back later for new tournaments'}
          </p>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && selectedTournament && (
        <JoinTournamentModal
          tournament={selectedTournament}
          user={user}
          profile={profile}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedTournament(null);
          }}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
                }
