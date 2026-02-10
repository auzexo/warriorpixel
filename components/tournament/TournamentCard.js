'use client';

import { useRouter } from 'next/navigation';
import { FaTrophy, FaUsers, FaCoins, FaClock, FaFire } from 'react-icons/fa';

export default function TournamentCard({ tournament }) {
  const router = useRouter();

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

  const getGameIcon = (game) => {
    switch (game) {
      case 'freefire':
        return '🔥';
      case 'bgmi':
        return '🎮';
      case 'stumbleguys':
        return '🏃';
      case 'minecraft':
        return '⛏️';
      default:
        return '🎮';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const spotsLeft = tournament.max_participants - tournament.participants_count;
  const isFull = spotsLeft === 0;

  return (
    <div
      onClick={() => router.push(`/tournaments/${tournament.id}`)}
      className="bg-discord-dark hover:bg-discord-darker rounded-xl p-6 border border-gray-800 hover:border-purple-500 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{getGameIcon(tournament.game)}</div>
          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
              {tournament.name}
            </h3>
            <p className="text-xs text-discord-text uppercase">{tournament.game}</p>
          </div>
        </div>
        <div className={`${getStatusColor(tournament.status)} px-3 py-1 rounded-full text-white text-xs font-bold uppercase`}>
          {tournament.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaTrophy className="text-yellow-400 text-sm" />
            <p className="text-xs text-discord-text">Prize Pool</p>
          </div>
          <p className="font-bold text-white">₹{tournament.prize_pool}</p>
        </div>

        <div className="bg-white bg-opacity-5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaCoins className="text-green-400 text-sm" />
            <p className="text-xs text-discord-text">Entry Fee</p>
          </div>
          <p className="font-bold text-white">
            {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
          </p>
        </div>
      </div>

      {/* Participants */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FaUsers className="text-purple-400 text-sm" />
            <span className="text-xs text-discord-text">Participants</span>
          </div>
          <span className={`text-sm font-bold ${isFull ? 'text-red-400' : 'text-white'}`}>
            {tournament.participants_count}/{tournament.max_participants}
          </span>
        </div>
        <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isFull ? 'bg-red-500' : spotsLeft <= 5 ? 'bg-orange-500' : 'bg-purple-500'
            }`}
            style={{
              width: `${(tournament.participants_count / tournament.max_participants) * 100}%`,
            }}
          ></div>
        </div>
        {spotsLeft <= 5 && spotsLeft > 0 && (
          <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
            <FaFire />
            Only {spotsLeft} spots left!
          </p>
        )}
      </div>

      {/* Start Time */}
      <div className="flex items-center gap-2 text-sm text-discord-text">
        <FaClock className="text-cyan-400" />
        <span>{formatDate(tournament.start_time)}</span>
      </div>
    </div>
  );
}
