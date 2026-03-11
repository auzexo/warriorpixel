'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaChartLine, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalTournaments: 0,
    upcomingTournaments: 0,
    liveTournaments: 0,
    completedTournaments: 0,
    totalRevenue: 0,
    totalPrizes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // User stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('banned_until', null);

      const { count: bannedUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('banned_until', 'is', null);

      // Tournament stats
      const { count: totalTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true });

      const { count: upcomingTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'upcoming');

      const { count: liveTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live');

      const { count: completedTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Financial stats
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('entry_fee, prize_pool, max_participants')
        .eq('status', 'completed');

      let totalRevenue = 0;
      let totalPrizes = 0;

      if (tournaments) {
        tournaments.forEach(t => {
          totalRevenue += parseFloat(t.entry_fee || 0) * (t.max_participants || 0);
          totalPrizes += parseFloat(t.prize_pool || 0);
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        bannedUsers: bannedUsers || 0,
        totalTournaments: totalTournaments || 0,
        upcomingTournaments: upcomingTournaments || 0,
        liveTournaments: liveTournaments || 0,
        completedTournaments: completedTournaments || 0,
        totalRevenue,
        totalPrizes
      });
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-discord-text">Platform statistics and insights</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <FaSync />
            Refresh
          </button>
        </div>

        {/* User Stats */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-600 rounded-xl p-6">
              <FaUsers className="text-3xl text-blue-400 mb-4" />
              <h3 className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</h3>
              <p className="text-sm text-blue-300">Total Users</p>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaArrowUp className="text-2xl text-green-400" />
                <span className="text-xs font-semibold text-green-300 uppercase">Active</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.activeUsers}</h3>
              <p className="text-sm text-green-300">Active Users</p>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-600 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaArrowDown className="text-2xl text-red-400" />
                <span className="text-xs font-semibold text-red-300 uppercase">Banned</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.bannedUsers}</h3>
              <p className="text-sm text-red-300">Banned Users</p>
            </div>
          </div>
        </div>

        {/* Tournament Stats */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Tournament Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-discord-dark border border-purple-600 rounded-xl p-6">
              <FaTrophy className="text-2xl text-purple-400 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalTournaments}</h3>
              <p className="text-sm text-purple-300">Total</p>
            </div>
            <div className="bg-discord-dark border border-yellow-600 rounded-xl p-6">
              <div className="text-2xl mb-3">⏳</div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.upcomingTournaments}</h3>
              <p className="text-sm text-yellow-300">Upcoming</p>
            </div>
            <div className="bg-discord-dark border border-green-600 rounded-xl p-6">
              <div className="text-2xl mb-3">🔴</div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.liveTournaments}</h3>
              <p className="text-sm text-green-300">Live</p>
            </div>
            <div className="bg-discord-dark border border-gray-600 rounded-xl p-6">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.completedTournaments}</h3>
              <p className="text-sm text-gray-300">Completed</p>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Financial Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-8">
              <FaMoneyBillWave className="text-4xl text-green-400 mb-4" />
              <h3 className="text-4xl font-bold text-white mb-2">₹{Math.floor(stats.totalRevenue)}</h3>
              <p className="text-sm text-green-300">Total Revenue</p>
              <p className="text-xs text-green-400 mt-2">From completed tournaments</p>
            </div>
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-600 rounded-xl p-8">
              <FaChartLine className="text-4xl text-orange-400 mb-4" />
              <h3 className="text-4xl font-bold text-white mb-2">₹{Math.floor(stats.totalPrizes)}</h3>
              <p className="text-sm text-orange-300">Total Prizes Distributed</p>
              <p className="text-xs text-orange-400 mt-2">All tournaments</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Platform Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
              <span className="text-discord-text">User Engagement Rate</span>
              <span className="text-white font-bold">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
              <span className="text-discord-text">Tournament Completion Rate</span>
              <span className="text-white font-bold">
                {stats.totalTournaments > 0 ? Math.round((stats.completedTournaments / stats.totalTournaments) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
              <span className="text-discord-text">Average Prize Pool</span>
              <span className="text-white font-bold">
                ₹{stats.completedTournaments > 0 ? Math.floor(stats.totalPrizes / stats.completedTournaments) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
              <span className="text-discord-text">Platform Profit</span>
              <span className="text-white font-bold">
                ₹{Math.floor(stats.totalRevenue - stats.totalPrizes)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
