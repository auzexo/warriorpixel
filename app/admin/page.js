'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaUsers, FaTrophy, FaMoneyBillWave, FaChartLine, FaShieldAlt } from 'react-icons/fa';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    upcomingTournaments: 0,
    liveTournaments: 0,
    completedTournaments: 0,
    totalRevenue: 0,
    totalGuilds: 4
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get tournament counts
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('status, entry_fee');

      const upcomingCount = tournaments?.filter(t => t.status === 'upcoming').length || 0;
      const liveCount = tournaments?.filter(t => t.status === 'live').length || 0;
      const completedCount = tournaments?.filter(t => t.status === 'completed').length || 0;

      // Calculate revenue
      const revenue = tournaments?.reduce((sum, t) => {
        return sum + parseFloat(t.entry_fee || 0);
      }, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalTournaments: tournaments?.length || 0,
        upcomingTournaments: upcomingCount,
        liveTournaments: liveCount,
        completedTournaments: completedCount,
        totalRevenue: revenue,
        totalGuilds: 4
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-discord-text">Welcome to WarriorPixel Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all">
          <FaUsers className="text-4xl text-purple-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-yellow-600 transition-all">
          <FaTrophy className="text-4xl text-yellow-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Tournaments</p>
          <p className="text-3xl font-bold text-white">{stats.totalTournaments}</p>
        </div>

        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-green-600 transition-all">
          <FaMoneyBillWave className="text-4xl text-green-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-white">₹{stats.totalRevenue.toFixed(0)}</p>
        </div>

        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-all">
          <FaShieldAlt className="text-4xl text-blue-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Active Guilds</p>
          <p className="text-3xl font-bold text-white">{stats.totalGuilds}</p>
        </div>
      </div>

      {/* Tournament Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-600 bg-opacity-10 border border-blue-600 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Upcoming</h3>
          <p className="text-4xl font-bold text-blue-400">{stats.upcomingTournaments}</p>
        </div>
        <div className="bg-green-600 bg-opacity-10 border border-green-600 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Live Now</h3>
          <p className="text-4xl font-bold text-green-400">{stats.liveTournaments}</p>
        </div>
        <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Completed</h3>
          <p className="text-4xl font-bold text-gray-400">{stats.completedTournaments}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/tournaments/create')}
            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            Create Tournament
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
          >
            Manage Users
          </button>
          <button
            onClick={() => router.push('/admin/guilds')}
            className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
          >
            Manage Guilds
          </button>
          <button
            onClick={() => router.push('/admin/announcements')}
            className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all"
          >
            Send Announcement
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
