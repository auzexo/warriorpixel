'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaTrophy, FaUsers, FaEdit, FaTrash, FaPlus, FaGamepad } from 'react-icons/fa';

export default function AdminDashboard() {
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

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTournaments(data || []);

      // Calculate stats
      const upcoming = (data || []).filter(t => t.status === 'upcoming').length;
      const live = (data || []).filter(t => t.status === 'live').length;
      const completed = (data || []).filter(t => t.status === 'completed').length;

      setStats({ 
        upcoming, 
        live, 
        completed, 
        total: (data || []).length 
      });
    } catch (error) {
      console.error('Error loading tournaments:', error);
      alert('Error loading tournaments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');

    try {
      // Delete all participants first
      await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete tournament
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) throw error;

      // Log action
      await logAdminAction(adminSession.adminAccountId, 'tournament_delete', {
        targetTournamentId: tournamentId,
        title: title,
      });

      alert('Tournament deleted successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error deleting tournament: ' + error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tournament Management</h1>
            <p className="text-discord-text">Manage all tournaments and participants</p>
          </div>
          <button
            onClick={() => router.push('/admin/tournaments/create')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <FaPlus />
            Create Tournament
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaTrophy className="text-2xl text-purple-400" />
              <p className="text-sm text-discord-text">Total</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaGamepad className="text-2xl text-blue-400" />
              <p className="text-sm text-discord-text">Upcoming</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaGamepad className="text-2xl text-green-400" />
              <p className="text-sm text-discord-text">Live</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.live}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaGamepad className="text-2xl text-gray-400" />
              <p className="text-sm text-discord-text">Completed</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">All Tournaments ({tournaments.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-discord-text mt-4">Loading tournaments...</p>
            </div>
          ) : tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {tournaments.map((tournament) => {
                // Calculate joined players count
                const joinedCount = tournament.tournament_participants?.length || 0;
                
                return (
                  <div 
                    key={tournament.id} 
                    className="bg-white bg-opacity-5 rounded-xl p-6 border border-gray-800 hover:border-red-500 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1 truncate">
                          {tournament.title}
                        </h3>
                        <p className="text-sm text-discord-text">{tournament.game}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ml-2 flex-shrink-0 ${
                        tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
                        tournament.status === 'live' ? 'bg-green-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {tournament.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white bg-opacity-5 rounded-lg p-3">
                        <p className="text-xs text-discord-text mb-1">Entry Fee</p>
                        <p className="text-white font-bold">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
                      </div>
                      <div className="bg-white bg-opacity-5 rounded-lg p-3">
                        <p className="text-xs text-discord-text mb-1">Prize Pool</p>
                        <p className="text-white font-bold">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
                      </div>
                      <div className="bg-white bg-opacity-5 rounded-lg p-3">
                        <p className="text-xs text-discord-text mb-1">Start Time</p>
                        <p className="text-white font-bold text-xs">
                          {new Date(tournament.start_time).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-5 rounded-lg p-3">
                        <p className="text-xs text-discord-text mb-1">Players</p>
                        <p className="text-white font-bold">
                          {joinedCount}/{tournament.max_participants}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <FaUsers />
                        Manage ({joinedCount})
                      </button>
                      <button
                        onClick={() => router.push(`/admin/tournaments/edit/${tournament.id}`)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(tournament.id, tournament.title)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-discord-text mb-4">No tournaments yet</p>
              <button
                onClick={() => router.push('/admin/tournaments/create')}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                <FaPlus />
                Create Your First Tournament
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
              }
