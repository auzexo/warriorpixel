// app/tournaments/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTournaments, joinTournament } from '@/lib/database';
import TournamentCard from '@/components/TournamentCard';
import JoinTournamentModal from '@/components/JoinTournamentModal';
import { FaFilter, FaGamepad, FaTrophy } from 'react-icons/fa';

export default function TournamentsPage() {
  const { userProfile, refreshProfile } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [filters, setFilters] = useState({
    game: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadTournaments();
  }, [filters]);

  const loadTournaments = async () => {
    setLoading(true);
    const result = await getTournaments(filters);
    if (result.success) {
      setTournaments(result.data);
    }
    setLoading(false);
  };

  const handleTournamentClick = (tournament) => {
    // Navigate to detail page instead of opening modal
    router.push(`/tournaments/${tournament.id}`);
  };

  const handleJoin = async (inGameName, voucherType) => {
    setJoining(true);
    const result = await joinTournament(
      selectedTournament.id, 
      userProfile.id, 
      inGameName,
      voucherType
    );
    
    if (result.success) {
      alert(`✅ Joined successfully!\n🎮 Your Seat: #${result.data.seat_number}\n🎯 IGN: ${inGameName}`);
      setShowJoinModal(false);
      loadTournaments();
      refreshProfile();
    } else {
      alert(`❌ ${result.error}`);
    }
    setJoining(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaGamepad />
          All Tournaments
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Join competitive tournaments and win amazing prizes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-primary-card rounded-xl p-4 md:p-6 border border-white border-opacity-5">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-purple-400" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Game</label>
            <select
              value={filters.game}
              onChange={(e) => setFilters({ ...filters, game: e.target.value })}
              className="w-full px-4 py-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Games</option>
              <option value="freefire">Free Fire</option>
              <option value="bgmi">BGMI</option>
              <option value="stumbleguys">Stumble Guys</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-primary-card rounded-xl h-80 skeleton"></div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard 
              key={tournament.id} 
              tournament={tournament}
              onClick={() => handleTournamentClick(tournament)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-primary-card rounded-xl p-8 md:p-12 text-center">
          <FaGamepad className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Tournaments Found</h3>
          <p className="text-gray-400">
            {filters.game !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters to see more tournaments'
              : 'Check back soon for new tournaments'}
          </p>
        </div>
      )}

      {/* Join Tournament Modal */}
      {showJoinModal && selectedTournament && (
        <JoinTournamentModal
          tournament={selectedTournament}
          userProfile={userProfile}
          onJoin={handleJoin}
          onClose={() => setShowJoinModal(false)}
          loading={joining}
        />
      )}
    </div>
  );
}
