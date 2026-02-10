'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTournaments } from '@/lib/database';
import TournamentCard from '@/components/tournament/TournamentCard';
import { FaTrophy, FaFilter } from 'react-icons/fa';

export default function TournamentsPage() {
  const { profile } = useAuth();
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaTrophy />
          Tournaments
        </h1>
        <p className="text-white text-opacity-90">Join competitive tournaments and win amazing prizes</p>
      </div>

      {/* Filters */}
      <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-purple-400" />
          <h3 className="font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-discord-text mb-2">Game</label>
            <select
              value={filters.game}
              onChange={(e) => setFilters({ ...filters, game: e.target.value })}
              className="w-full px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Games</option>
              <option value="freefire">Free Fire</option>
              <option value="bgmi">BGMI</option>
              <option value="stumbleguys">Stumble Guys</option>
              <option value="minecraft">Minecraft</option>
              <option value="valorant">Valorant</option>
              <option value="codm">Call of Duty Mobile</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-discord-text mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-discord-text">Loading tournaments...</p>
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-discord-dark rounded-xl border border-gray-800">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-discord-text">No tournaments found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
