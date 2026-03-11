'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
            <h3 className="text-3xl font-bold text-white mb-1">-</h3>
            <p className="text-sm text-blue-300">Total Users</p>
            <div className="mt-3 text-xs text-blue-400">
              Loading stats...
            </div>
          </div>

          {/* Total Tournaments */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaTrophy className="text-3xl text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase">Tournaments</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">-</h3>
            <p className="text-sm text-purple-300">Total Tournaments</p>
            <div className="mt-3 text-xs text-purple-400">
              Loading stats...
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaMoneyBillWave className="text-3xl text-green-400" />
              <span className="text-xs font-semibold text-green-300 uppercase">Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">₹-</h3>
            <p className="text-sm text-green-300">Total Revenue</p>
            <div className="mt-3 text-xs text-green-400">
              Loading stats...
            </div>
          </div>

          {/* Prizes Distributed */}
          <div className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-3xl text-orange-400" />
              <span className="text-xs font-semibold text-orange-300 uppercase">Prizes</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">₹-</h3>
            <p className="text-sm text-orange-300">Total Distributed</p>
            <div className="mt-3 text-xs text-orange-400">
              Loading stats...
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/admin/tournaments/create"
              className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2 text-center"
            >
              <FaTrophy className="text-2xl" />
              <span className="text-sm">New Tournament</span>
            </a>
            <a
              href="/admin/users"
              className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2 text-center"
            >
              <FaUsers className="text-2xl" />
              <span className="text-sm">Manage Users</span>
            </a>
            <a
              href="/admin/announcements/create"
              className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2 text-center"
            >
              <FaChartLine className="text-2xl" />
              <span className="text-sm">Announcement</span>
            </a>
            <a
              href="/admin/tournaments"
              className="p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all flex flex-col items-center gap-2 text-center"
            >
              <FaTrophy className="text-2xl" />
              <span className="text-sm">View All</span>
            </a>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 WarriorPixel Admin Panel</h2>
          <p className="text-discord-text mb-6">
            Manage tournaments, users, and platform settings from this dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/admin/tournaments"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
            >
              View Tournaments
            </a>
            <a
              href="/admin/users"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              View Users
            </a>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <h3 className="font-semibold text-white mb-2">System Status</h3>
            <p className="text-sm text-green-400">✓ All systems operational</p>
          </div>

          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Platform</h3>
            <p className="text-sm text-discord-text">WarriorPixel Gaming</p>
          </div>

          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <h3 className="font-semibold text-white mb-2">Version</h3>
            <p className="text-sm text-discord-text">Admin v1.0</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
