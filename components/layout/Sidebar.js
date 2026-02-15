'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  FaHome,
  FaTrophy,
  FaFire,
  FaCube,
  FaVideo,
  FaGamepad,
  FaTrophy as FaAchievement,
  FaWallet,
  FaInfoCircle,
  FaDownload,
  FaCrown,
  FaSignOutAlt,
  FaTimes,
} from 'react-icons/fa';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const menuItems = [
    { icon: FaHome, label: 'Home', path: '/' },
    { icon: FaTrophy, label: 'Tournaments', path: '/tournaments', requireAuth: true },
    { icon: FaFire, label: 'Free Fire Guilds', path: '/freefire', requireAuth: true },
    { icon: FaCube, label: 'Minecraft Shop', path: '/minecraft', requireAuth: true },
    { icon: FaVideo, label: 'Videos', path: '/videos' },
    { icon: FaGamepad, label: 'Games', path: '/games', requireAuth: true },
    { icon: FaAchievement, label: 'Achievements', path: '/achievements', requireAuth: true },
    { icon: FaWallet, label: 'Wallet', path: '/wallet', requireAuth: true },
    { icon: FaInfoCircle, label: 'Info & Help', path: '/info' },
    { icon: FaDownload, label: 'Download App', path: '/download' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
        return;
      }

      // Clear local storage (admin sessions, etc.)
      localStorage.clear();
      
      // Close sidebar if mobile
      if (onClose) onClose();
      
      // Force reload to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 h-screen bg-discord-dark border-r border-gray-800 w-64 flex flex-col z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all z-50"
      >
        <FaTimes className="text-xl text-white" />
      </button>

      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <FaTrophy className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">WarriorPixel</h1>
            <p className="text-xs text-discord-text">Gaming Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-discord-purple text-white'
                    : 'hover:bg-white hover:bg-opacity-5 text-gray-300'
                }`}
              >
                <Icon className="text-lg" />
                <span className="font-medium">{item.label}</span>
                {item.requireAuth && !profile && (
                  <span className="ml-auto text-xs bg-yellow-500 bg-opacity-20 text-yellow-500 px-2 py-0.5 rounded">
                    Login
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Panel - Only for admins */}
          {profile?.is_admin && (
            <button
              onClick={() => handleNavigation('/admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === '/admin'
                  ? 'bg-red-600 text-white'
                  : 'hover:bg-red-600 hover:bg-opacity-20 text-red-400'
              }`}
            >
              <FaCrown className="text-lg" />
              <span className="font-medium">Admin Panel</span>
            </button>
          )}
        </div>
      </nav>

      {/* User Info & Logout */}
      {profile && (
        <div className="p-4 border-t border-gray-800">
          <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-white">{profile.username}</p>
                <p className="text-xs text-discord-text truncate">UID: {profile.uid}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-discord-text">Level {profile.level || 1}</span>
              <span className="text-purple-400">{profile.achievement_points || 0} pts</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
              }
