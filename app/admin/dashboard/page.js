'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getTournaments } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaUsers, FaEye, FaCoins } from 'react-icons/fa';

export default function TournamentManagementPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    live: 0,
    completed: 0,
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    const result = await getTournaments({});
    
    if (result.success) {
      setTournaments(result.data);
      
      // Calculate stats
      const stats = result.data.reduce((acc, t) => {
        acc.total++;
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, { total: 0, upcoming: 0, live: 0, completed: 0 });
      
      setStats(stats);
    }
    
    setLoading(false);
  };

  const handleDelete = async (tournamentId) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (!error) {
      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'tournament_delete', {
        targetTournamentId: tournamentId,
      });

      alert('Tournament deleted successfully');
      loadTournaments();
    } else {
      alert('Error deleting tournament: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tournament Management</h1>
            <p className="text-discord-text">Create, edit, and manage all tournaments</p>
          </div>
          <button
            onClick={() => router.push('/admin/tournaments/create')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <FaPlus />
            Create Tournament
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Total Tournaments</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-blue-500">
            <p className="text-discord-text text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-blue-400">{stats.upcoming}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-red-500">
            <p className="text-discord-text text-sm mb-1">Live</p>
            <p className="text-3xl font-bold text-red-400">{stats.live}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-500">
            <p className="text-discord-text text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-gray-400">{stats.completed}</p>
          </div>
        </div>

        {/* Tournaments Table */}
        <div className="bg-discord-dark rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-5">
                <tr>
                  <th className="text-left p-4 text-discord-text font-semibold">Tournament</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Game</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Status</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Participants</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Prize Pool</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Entry Fee</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Start Time</th>
                  <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : tournaments.length > 0 ? (
                  tournaments.map((tournament) => (
                    <tr key={tournament.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FaTrophy className="text-yellow-400" />
                          <div>
                            <p className="font-semibold text-white">{tournament.name}</p>
                            <p className="text-xs text-discord-text">{tournament.tournament_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white uppercase">{tournament.game}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          tournament.status === 'live' ? 'bg-red-500 text-white' :
                          tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {tournament.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-semibold">
                          {tournament.participants_count}/{tournament.max_participants}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-semibold">₹{tournament.prize_pool}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white">
                          {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-discord-text">{formatDate(tournament.start_time)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                            title="View Participants"
                          >
                            <FaUsers />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/tournaments/edit/${tournament.id}`)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(tournament.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-discord-text">
                      No tournaments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
  }
