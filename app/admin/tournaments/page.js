'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaUsers, FaEye } from 'react-icons/fa';

export default function AdminTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    live: 0,
    completed: 0
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, tournament_participants(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTournaments(data || []);

      // Calculate stats
      const stats = {
        total: data?.length || 0,
        upcoming: data?.filter(t => t.status === 'upcoming').length || 0,
        live: data?.filter(t => t.status === 'live').length || 0,
        completed: data?.filter(t => t.status === 'completed').length || 0
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Tournament deleted successfully');
      loadTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error deleting tournament');
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Tournament Management</h1>
        <p className="text-discord-text">Manage all tournaments and participants</p>
      </div>

      {/* Create Button */}
      <button
        onClick={() => router.push('/admin/tournaments/create')}
        className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold mb-6 flex items-center justify-center gap-2 transition-all"
      >
        <FaPlus />
        Create Tournament
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaTrophy className="text-3xl text-purple-400 mb-2" />
          <p className="text-sm text-discord-text">Total</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <div className="text-3xl text-blue-400 mb-2">🎮</div>
          <p className="text-sm text-discord-text">Upcoming</p>
          <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <div className="text-3xl text-green-400 mb-2">🟢</div>
          <p className="text-sm text-discord-text">Live</p>
          <p className="text-3xl font-bold text-white">{stats.live}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <div className="text-3xl text-gray-400 mb-2">🏁</div>
          <p className="text-sm text-discord-text">Completed</p>
          <p className="text-3xl font-bold text-white">{stats.completed}</p>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">All Tournaments ({tournaments.length})</h2>
        
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-discord-text mb-4">No tournaments yet</p>
            <button
              onClick={() => router.push('/admin/tournaments/create')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
            >
              Create First Tournament
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => {
              const participantCount = tournament.tournament_participants?.[0]?.count || 0;
              
              return (
                <div
                  key={tournament.id}
                  className="bg-discord-darkest border border-gray-700 rounded-xl p-6 hover:border-purple-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{tournament.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          tournament.status === 'upcoming' ? 'bg-blue-600' :
                          tournament.status === 'live' ? 'bg-green-600' :
                          tournament.status === 'completed' ? 'bg-gray-600' :
                          'bg-purple-600'
                        } text-white`}>
                          {tournament.status}
                        </span>
                      </div>
                      <p className="text-discord-text">{tournament.game}</p>
                    </div>
                  </div>

                  {/* Tournament Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-discord-dark rounded-lg p-3">
                      <p className="text-xs text-discord-text mb-1">Entry Fee</p>
                      <p className="text-lg font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
                    </div>
                    <div className="bg-discord-dark rounded-lg p-3">
                      <p className="text-xs text-discord-text mb-1">Prize Pool</p>
                      <p className="text-lg font-bold text-green-400">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
                    </div>
                    <div className="bg-discord-dark rounded-lg p-3">
                      <p className="text-xs text-discord-text mb-1">Start Time</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(tournament.start_time).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="bg-discord-dark rounded-lg p-3">
                      <p className="text-xs text-discord-text mb-1">Players</p>
                      <p className="text-lg font-bold text-white">{participantCount}/{tournament.max_participants}</p>
                    </div>
                  </div>

                  {/* Room Details (if added) */}
                  {tournament.room_id && (
                    <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-yellow-400 mb-1">Room ID</p>
                          <p className="font-mono font-bold text-white">{tournament.room_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-yellow-400 mb-1">Password</p>
                          <p className="font-mono font-bold text-white">{tournament.room_password}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <FaUsers />
                      Manage ({participantCount})
                    </button>
                    <button
                      onClick={() => router.push(`/admin/tournaments/edit/${tournament.id}`)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteTournament(tournament.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
