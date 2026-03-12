'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatISTDate } from '@/lib/timeUtils';
import { updateTournamentStatuses } from '@/lib/tournamentStatusUpdater';
import { logAdminAction } from '@/lib/adminLogger';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaUsers, FaHashtag, FaCopy, FaMoneyBillWave, FaClock, FaFire, FaInfoCircle } from 'react-icons/fa';

export default function AdminTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      // FIRST: Auto-update tournament statuses
      await updateTournamentStatuses();

      const { data, error } = await supabase
        .from('tournaments')
        .select('*, preset:tournament_presets(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tournamentsWithDetails = await Promise.all(
        (data || []).map(async (tournament) => {
          const { count: participantCount } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          const { data: revenue } = await supabase
            .from('transactions')
            .select('amount')
            .eq('tournament_id', tournament.id)
            .eq('type', 'tournament_entry');

          const totalRevenue = revenue?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

          return {
            ...tournament,
            participantCount: participantCount || 0,
            totalRevenue: totalRevenue,
            spotsLeft: tournament.max_participants - (participantCount || 0)
          };
        })
      );

      setTournaments(tournamentsWithDetails);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id) => {
    const tournament = tournaments.find(t => t.id === id);
  
    if (!confirm(
      `⚠️ DELETE TOURNAMENT?\n\n` +
      `Title: ${tournament?.title || 'Unknown'}\n` +
      `Participants: ${tournament?.participantCount || 0}\n` +
      `Status: ${tournament?.status || 'unknown'}\n\n` +
      `This will permanently remove the tournament and all participant data.\n` +
      `Transaction history will be preserved.\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type the tournament title to confirm deletion.`
    )) return;

    // Extra confirmation for tournaments with participants
    if (tournament.participantCount > 0) {
      const confirmTitle = prompt(`⚠️ FINAL CONFIRMATION\n\nType "${tournament.title}" exactly to confirm deletion:`);
      if (confirmTitle !== tournament.title) {
        alert('❌ Deletion cancelled - title did not match');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // LOG THE DELETE ACTION
      await logAdminAction('tournament_delete', {
        tournament_id: id,
        tournament_title: tournament.title,
        participants_count: tournament.participantCount,
        status: tournament.status,
        prize_pool: tournament.prize_pool,
        entry_fee: tournament.entry_fee
      });

      alert('✅ Tournament deleted successfully!');
      loadTournaments();
    } catch (error) {
      console.error('❌ Delete error:', error);
      alert('Error deleting tournament:\n\n' + error.message);
    }
  };

  const copyTournamentId = (id) => {
    navigator.clipboard.writeText(id);
    alert('✅ Tournament ID copied to clipboard!');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tournament Management</h1>
          <p className="text-discord-text">Manage all tournaments</p>
        </div>
        <button
          onClick={() => router.push('/admin/tournaments/create')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <FaPlus />
          Create Tournament
        </button>
      </div>

      {/* Auto-Status Info Banner */}
      <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-xl text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-1 text-sm">
              ⚡ Auto-Status System Active
            </h3>
            <p className="text-xs text-blue-300">
              Tournaments automatically switch from UPCOMING → LIVE when start time is reached. All times shown in IST.
            </p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text">Total Tournaments</p>
          <p className="text-2xl font-bold text-white">{tournaments.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaFire className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text">Live Now</p>
          <p className="text-2xl font-bold text-red-400">{tournaments.filter(t => t.status === 'live').length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaClock className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text">Upcoming</p>
          <p className="text-2xl font-bold text-blue-400">{tournaments.filter(t => t.status === 'upcoming').length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">
            ₹{tournaments.reduce((sum, t) => sum + (t.totalRevenue || 0), 0).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-12 text-center">
            <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-white mb-2">No Tournaments</p>
            <p className="text-discord-text mb-6">Create your first tournament to get started</p>
            <button
              onClick={() => router.push('/admin/tournaments/create')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
            >
              Create First Tournament
            </button>
          </div>
        ) : (
          tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white break-words">{tournament.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 ${
                      tournament.status === 'upcoming' ? 'bg-blue-600' :
                      tournament.status === 'live' ? 'bg-red-600 animate-pulse' :
                      tournament.status === 'completed' ? 'bg-gray-600' :
                      'bg-purple-600'
                    } text-white`}>
                      {tournament.status === 'live' && '🔴 '}
                      {tournament.status}
                    </span>
                    {tournament.preset && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white flex-shrink-0">
                        {tournament.preset.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <p className="text-discord-text">{tournament.game}</p>
                    <button
                      onClick={() => copyTournamentId(tournament.id)}
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all"
                      title="Copy Tournament ID"
                    >
                      <FaHashtag className="text-xs" />
                      <span className="font-mono text-xs">ID-{tournament.id.slice(0, 8)}</span>
                      <FaCopy className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-discord-darkest rounded-lg p-3">
                  <p className="text-xs text-discord-text mb-1">Entry Fee</p>
                  <p className="text-lg font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3">
                  <p className="text-xs text-discord-text mb-1">Prize Pool</p>
                  <p className="text-lg font-bold text-green-400">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3">
                  <p className="text-xs text-discord-text mb-1">Participants</p>
                  <p className="text-lg font-bold text-white">{tournament.participantCount}/{tournament.max_participants}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3">
                  <p className="text-xs text-discord-text mb-1">Spots Left</p>
                  <p className={`text-lg font-bold ${tournament.spotsLeft === 0 ? 'text-red-400' : tournament.spotsLeft <= 5 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {tournament.spotsLeft}
                  </p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3">
                  <p className="text-xs text-discord-text mb-1">Revenue</p>
                  <p className="text-lg font-bold text-green-400">₹{tournament.totalRevenue.toFixed(0)}</p>
                </div>
              </div>

              {/* Preset Details */}
              {tournament.preset && (
                <div className="bg-purple-600 bg-opacity-10 border border-purple-600 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-purple-400 mb-1">Per Kill</p>
                      <p className="font-bold text-white">₹{tournament.preset.per_kill_reward}</p>
                    </div>
                    <div>
                      <p className="text-purple-400 mb-1">Booyah</p>
                      <p className="font-bold text-white">₹{tournament.preset.booyah_reward}</p>
                    </div>
                    <div>
                      <p className="text-purple-400 mb-1">Min Players</p>
                      <p className="font-bold text-white">{tournament.preset.min_players}</p>
                    </div>
                    <div>
                      <p className="text-purple-400 mb-1">Max Players</p>
                      <p className="font-bold text-white">{tournament.preset.max_players}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Time - IST FORMAT */}
              <div className="flex items-center gap-2 text-sm text-discord-text mb-4">
                <FaClock className="flex-shrink-0" />
                <span className="break-words">
                  Start: {formatISTDate(tournament.start_time, true)}
                </span>
              </div>

              {/* Room Details */}
              {tournament.room_id && (
                <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Room ID</p>
                      <p className="font-mono font-bold text-white break-all">{tournament.room_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Password</p>
                      <p className="font-mono font-bold text-white break-all">{tournament.room_password}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <FaUsers />
                  Manage ({tournament.participantCount})
                </button>
                <button
                  onClick={() => router.push(`/admin/tournaments/edit/${tournament.id}`)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all"
                  title="Edit Tournament"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteTournament(tournament.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                  title="Delete Tournament"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
