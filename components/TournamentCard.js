'use client';

import { FaUsers, FaTrophy, FaCalendar, FaGamepad } from 'react-icons/fa';
import { format } from 'date-fns';

const TournamentCard = ({ tournament, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getGameGradient = (game) => {
    switch (game) {
      case 'freefire': return 'from-blue-600 to-indigo-600';
      case 'bgmi': return 'from-red-600 to-orange-600';
      case 'stumbleguys': return 'from-pink-600 to-rose-600';
      default: return 'from-gray-600 to-slate-600';
    }
  };

  const getGameName = (game) => {
    switch (game) {
      case 'freefire': return 'Free Fire';
      case 'bgmi': return 'BGMI';
      case 'stumbleguys': return 'Stumble Guys';
      default: return game;
    }
  };

  const tournamentId = tournament?.tournament_id || null;
  const name = tournament?.name || 'Tournament';
  const game = tournament?.game || 'unknown';
  const status = tournament?.status || 'upcoming';
  const prizePool = tournament?.prize_pool || 0;
  const participantsCount = tournament?.participants_count || 0;
  const maxParticipants = tournament?.max_participants || 0;
  const entryFee = tournament?.entry_fee || 0;
  const tournamentDate = tournament?.tournament_date || null;

  return (
    <div 
      onClick={onClick}
      className="bg-primary-card rounded-xl overflow-hidden border border-white border-opacity-5 hover:border-purple-500 transition-all cursor-pointer group"
    >
      <div className={`h-32 bg-gradient-to-br ${getGameGradient(game)} relative`}>
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(status)}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white line-clamp-2">{name}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {tournamentId && (
          <div className="text-xs font-mono text-gray-400 bg-white bg-opacity-5 px-2 py-1 rounded inline-block">
            {tournamentId}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <FaGamepad className="text-gray-400" />
          <span className="px-2 py-1 bg-white bg-opacity-5 rounded text-gray-400 capitalize">
            {getGameName(game)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-lg font-bold">
          <FaTrophy className="text-yellow-500" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            ₹{prizePool}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white border-opacity-5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FaUsers />
            <span>{participantsCount}/{maxParticipants}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FaCalendar />
            <span>
              {tournamentDate ? format(new Date(tournamentDate), 'MMM dd') : 'TBA'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white border-opacity-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Entry Fee:</span>
            <span className="font-semibold text-white">
              {entryFee > 0 ? `₹${entryFee}` : 'Free'}
            </span>
          </div>
        </div>

        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold group-hover:scale-105 transition-transform">
          {status === 'live' ? 'Join Now' : status === 'completed' ? 'View Results' : 'View Details'}
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;
