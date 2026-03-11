'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaUsers, FaBullhorn, FaShieldAlt, FaVideo, FaMoneyBillWave, FaChartLine, FaFileAlt, FaKey, FaCog, FaCrown } from 'react-icons/fa';

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

  const mainSections = [
    { name: 'Tournaments', path: '/admin/tournaments', icon: FaTrophy, color: 'purple', desc: 'Create and manage tournaments' },
    { name: 'Users', path: '/admin/users', icon: FaUsers, color: 'blue', desc: 'View and moderate users' },
    { name: 'Guilds', path: '/admin/guilds', icon: FaShieldAlt, color: 'indigo', desc: 'Manage guild system' },
  ];

  const contentSections = [
    { name: 'Announcements', path: '/admin/announcements', icon: FaBullhorn, color: 'green', desc: 'Post announcements' },
    { name: 'Videos & Content', path: '/admin/content', icon: FaVideo, color: 'pink', desc: 'Manage media content' },
  ];

  const financialSections = [
    { name: 'Transactions', path: '/admin/transactions', icon: FaMoneyBillWave, color: 'emerald', desc: 'View all transactions' },
    { name: 'Analytics', path: '/admin/analytics', icon: FaChartLine, color: 'orange', desc: 'Platform statistics' },
  ];

  const systemSections = [
    { name: 'Admin Logs', path: '/admin/logs', icon: FaFileAlt, color: 'gray', desc: 'View admin actions' },
    { name: 'Permissions', path: '/admin/permissions', icon: FaKey, color: 'red', desc: 'Manage permissions' },
    { name: 'Settings', path: '/admin/settings', icon: FaCog, color: 'slate', desc: 'Platform settings' },
  ];

  const SectionCard = ({ item }) => (
    <a
      href={item.path}
      className={`bg-discord-dark border border-${item.color}-600 hover:border-${item.color}-500 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-${item.color}-600/20 group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-${item.color}-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
          <item.icon className="text-2xl text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-${item.color}-400 transition-colors">{item.name}</h3>
          <p className="text-sm text-discord-text">{item.desc}</p>
        </div>
      </div>
    </a>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCrown className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Admin Panel</h1>
          <p className="text-red-100">WarriorPixel Management Dashboard</p>
        </div>

        {/* Main Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
            Main Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mainSections.map((item) => (
              <SectionCard key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            Content Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentSections.map((item) => (
              <SectionCard key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Financial Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-orange-600 rounded-full"></div>
            Financial & Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialSections.map((item) => (
              <SectionCard key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* System Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-red-600 rounded-full"></div>
            System & Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systemSections.map((item) => (
              <SectionCard key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Quick Stats - Static Display */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-discord-darkest rounded-lg">
              <p className="text-2xl font-bold text-purple-400 mb-1">🏆</p>
              <p className="text-sm text-white font-semibold">Tournaments</p>
              <p className="text-xs text-discord-text mt-1">View in Analytics</p>
            </div>
            <div className="text-center p-4 bg-discord-darkest rounded-lg">
              <p className="text-2xl font-bold text-blue-400 mb-1">👥</p>
              <p className="text-sm text-white font-semibold">Users</p>
              <p className="text-xs text-discord-text mt-1">View in Analytics</p>
            </div>
            <div className="text-center p-4 bg-discord-darkest rounded-lg">
              <p className="text-2xl font-bold text-green-400 mb-1">💰</p>
              <p className="text-sm text-white font-semibold">Revenue</p>
              <p className="text-xs text-discord-text mt-1">View in Analytics</p>
            </div>
            <div className="text-center p-4 bg-discord-darkest rounded-lg">
              <p className="text-2xl font-bold text-orange-400 mb-1">📊</p>
              <p className="text-sm text-white font-semibold">Analytics</p>
              <p className="text-xs text-discord-text mt-1">Full statistics</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a
              href="/admin/analytics"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all"
            >
              <FaChartLine />
              View Full Analytics
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-white mb-1">System Status</h3>
            <p className="text-sm text-green-400">All systems operational</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🎮</div>
            <h3 className="font-semibold text-white mb-1">Platform</h3>
            <p className="text-sm text-discord-text">WarriorPixel Gaming</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="font-semibold text-white mb-1">Admin Version</h3>
            <p className="text-sm text-discord-text">v1.0 - Phase 3</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
