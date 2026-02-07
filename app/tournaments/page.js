'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTournaments } from '@/lib/database';
import TournamentCard from '@/components/TournamentCard';
import { FaTrophy, FaFilter } from 'react-icons/fa';

export default function TournamentsPage() {
  const { userProfile } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ game: 'all', status: 'all' });

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaTrophy />
          All Tournaments
        </h1>
        <p className="text-white text-opacity-90">Join competitive tournaments and win amazing prizes</p>
      </div>

      <div className="bg-primary-card rounded-xl p-4 border border-white border-opacity-5">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-purple-400" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-primary-card rounded-xl border border-white border-opacity-5">
          <p className="text-gray-400">No tournaments found</p>
        </div>
      )}
    </div>
  );
}
