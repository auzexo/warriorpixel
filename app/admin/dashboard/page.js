'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter } from 'next/navigation';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaChartLine, FaCalendar, FaClock, FaGamepad, FaCheckCircle, FaExclamationTriangle, FaBullhorn } from 'react-icons/fa';

export default function AdminDashboard() {
  const router = useRouter();
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');

      // Get user stats with error handling
      let totalUsers = 0;
      let activeUsers = 0;
      let bannedUsers = 0;

      try {
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!userError) totalUsers = userCount || 0;

        const { count: activeCount, error: activeError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .is('banned_until', null);
        
        if (!activeError) activeUsers = activeCount || 0;

        const { count: bannedCount, error: bannedError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .not('banned_until', 'is', null);
        
        if (!bannedError) bannedUsers = bannedCount || 0;
      } catch (err) {
        console.error('Error loading user stats:', err);
      }

      // Get tournament stats with error handling
      let totalTournaments = 0;
      let upcomingTournaments = 0;
      let liveTournaments = 0;
      let completedTournaments = 0;

      try {
        const { count: tournamentCount, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true });
        
        if (!tournamentError) totalTournaments = tournamentCount || 0;

        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'upcoming');
        
        if (!upcomingError) upcomingTournaments = upcomingCount || 0;

        const { count: liveCount, error: liveError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'live');
        
        if (!liveError) liveTournaments = liveCount || 0;

        const { count: completedCount, error: completedError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        if (!completedError) completedTournaments = completedCount || 0;
      } catch (err) {
        console.error('Error loading tournament stats:', err);
      }

      // Get financial stats with error handling
      let totalRevenue = 0;
      let totalPrizes = 0;

      try {
        const { data: tournaments, error: financeError } = await supabase
          .from('tournaments')
          .select('entry_fee, prize_pool, status, max_participants')
          .eq('status', 'completed');

        if (!financeError && tournaments) {
          tournaments.forEach(t => {
            const revenue = parseFloat(t.entry_fee || 0) * (t.max_participants || 0);
            totalRevenue += revenue;
            totalPrizes += parseFloat(t.prize_pool || 0);
          });
        }
      } catch (err) {
        console.error('Error loading financial stats:', err);
      }

      // Get recent admin logs with error handling
      try {
        const { data: logs, error: logsError } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!logsError && logs) {
          setRecentActivity(logs);
        }
      } catch (err) {
        console.error('Error loading admin logs:', err);
      }

      setStats({
        totalUsers,
        activeUsers,
        bannedUsers,
        totalTournaments,
        upcomingTournaments,
        liveTournaments,
        completedTournaments,
        totalRevenue,
        totalPrizes
      });

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadDashboardData();
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
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
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-discord-text">Welcome to WarriorPixel Admin Panel</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaUsers className="text-3xl text-blue-400" />
              <span className="text-xs font-semibold text-blue-300 uppercase">Users</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</h3>
            <p className="text-sm text-blue-300">Total Users</p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="text-green-400">✓ {stats.activeUsers} Active</span>
              <span className="text-red-400">✗ {stats.bannedUsers} Banned</span>
            </div>
          </div>

          {/* Total Tournaments */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaTrophy className="text-3xl text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase">Tournaments</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.totalTournaments}</h3>
            <p className="text-sm text-purple-300">Total Tournaments</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-yellow-400">⏳ {stats.upcomingTournaments}</span>
              <span className="text-green-400">🔴 {stats.liveTournaments}</span>
              <span className="text-gray-400">✓ {stats.completedTournaments}</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaMoneyBillWave className="text-3xl text-green-400" />
              <span className="text-xs font-semibold text-green-300 uppercase">Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">₹{Math.floor(stats.totalRevenue)}</h3>
            <p className="text-sm text-green-300">Total Revenue</p>
            <div className="mt-3 text-xs text-green-400">
              From completed tournaments
            </div>
          </div>

          {/* Prizes Distributed */}
          <div className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-3xl text-orange-400" />
              <span className="text-xs font-semibold text-orange-300 uppercase">Prizes</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">₹{Math.floor(stats.totalPrizes)}</h3>
            <p className="text-sm text-orange-300">Total Distributed</p>
            <div className="mt-3 text-xs text-orange-400">
              All tournaments
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/admin/tournaments/create')}
              className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2"
            >
              <FaTrophy className="text-2xl" />
              <span className="text-sm">New Tournament</span>
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2"
            >
              <FaUsers className="text-2xl" />
              <span className="text-sm">Manage Users</span>
            </button>
            <button
              onClick={() => router.push('/admin/announcements/create')}
              className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2"
            >
              <FaBullhorn className="text-2xl" />
              <span className="text-sm">Announcement</span>
            </button>
            <button
              onClick={() => router.push('/admin/analytics')}
              className="p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2"
            >
              <FaChartLine className="text-2xl" />
              <span className="text-sm">Analytics</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Admin Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-discord-text">
              <FaClock className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-white font-medium">{log.action || 'Action'}</p>
                      <p className="text-xs text-discord-text">{log.details || 'Details'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-discord-text">
                    {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaCheckCircle className="text-green-400 text-xl" />
              <h3 className="font-semibold text-white">System Status</h3>
            </div>
            <p className="text-sm text-discord-text">All systems operational</p>
          </div>

          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaCalendar className="text-blue-400 text-xl" />
              <h3 className="font-semibold text-white">Upcoming</h3>
            </div>
            <p className="text-sm text-discord-text">{stats.upcomingTournaments} tournaments scheduled</p>
          </div>

          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FaExclamationTriangle className="text-yellow-400 text-xl" />
              <h3 className="font-semibold text-white">Alerts</h3>
            </div>
            <p className="text-sm text-discord-text">{stats.bannedUsers} banned users</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
