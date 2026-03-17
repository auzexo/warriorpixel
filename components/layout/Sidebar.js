'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBanCheck } from '@/hooks/useBanCheck';
import { supabase } from '@/lib/supabase';
import { formatISTDate } from '@/lib/timeUtils';
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
  FaBan,
  FaExclamationTriangle,
} from 'react-icons/fa';
import Link from 'next/link';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const { banStatus, isBanned } = useBanCheck();

  // Pages that banned users CAN access
  const allowedForBanned = ['/', '/videos', '/info', '/download', '/help', '/about', '/contact', '/restricted'];

  const menuItems = [
    { icon: FaHome, label: 'Home', path: '/', color: 'text-purple-400', allowedWhenBanned: true },
    { icon: FaTrophy, label: 'Tournaments', path: '/tournaments', requireAuth: true, color: 'text-purple-400', allowedWhenBanned: false },
    { icon: FaFire, label: 'Free Fire Guilds', path: '/freefire', requireAuth: true, color: 'text-blue-400', allowedWhenBanned: false },
    { icon: FaCube, label: 'Minecraft Shop', path: '/minecraft', requireAuth: true, color: 'text-green-400', allowedWhenBanned: false },
    { icon: FaVideo, label: 'Videos', path: '/videos', color: 'text-purple-400', allowedWhenBanned: true },
    { icon: FaGamepad, label: 'Games', path: '/games', requireAuth: true, color: 'text-purple-400', allowedWhenBanned: false },
    { icon: FaAchievement, label: 'Achievements', path: '/achievements', requireAuth: true, color: 'text-orange-400', allowedWhenBanned: false },
    { icon: FaWallet, label: 'Wallet', path: '/wallet', requireAuth: true, color: 'text-purple-400', allowedWhenBanned: false },
    { icon: FaInfoCircle, label: 'Info & Help', path: '/info', color: 'text-purple-400', allowedWhenBanned: true },
    { icon: FaDownload, label: 'Download App', path: '/download', color: 'text-purple-400', allowedWhenBanned: true },
  ];

  const handleNavigation = (path, isRestricted) => {
    // Block navigation to restricted pages for banned users
    if (isBanned && isRestricted) {
      alert('❌ Access Restricted\n\nThis feature is not available while your account is restricted.\n\nAllowed pages: Home, Videos, Info, Downloads');
      return;
    }
    
    router.push(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
      if (onClose) onClose();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-discord-dark border-r border-gray-800 w-64 flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <FaTrophy className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">WarriorPixel</h1>
              <p className="text-xs text-discord-text">Gaming Platform</p>
            </div>
          </div>
        </div>

        {/* BAN STATUS INDICATOR */}
        {isBanned && banStatus && (
          <div className="mx-4 mt-4 mb-2">
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <FaBan className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-400 font-bold text-xs mb-1">
                    {banStatus.ban_type === 'permanent' ? 'BANNED' : 'SUSPENDED'}
                  </p>
                  <p className="text-red-300 text-xs break-words">
                    Limited access mode
                  </p>
                  {banStatus.ban_type === 'temporary' && banStatus.expires_at && (
                    <p className="text-red-400 text-xs mt-1">
                      Until: {formatISTDate(banStatus.expires_at, true)}
                    </p>
                  )}
                </div>
              </div>
              <Link 
                href="/restricted"
                onClick={onClose}
                className="block text-center text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2"
              >
                View Details →
              </Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isRestricted = isBanned && !item.allowedWhenBanned;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path, isRestricted)}
                  disabled={isRestricted}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : isRestricted
                      ? 'text-gray-600 cursor-not-allowed opacity-50'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`text-lg ${isActive ? 'text-white' : isRestricted ? 'text-gray-600' : item.color}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isRestricted && (
                    <FaBan className="ml-auto text-xs text-red-400" />
                  )}
                  {!isRestricted && item.requireAuth && !profile && (
                    <span className="ml-auto text-xs bg-yellow-500 bg-opacity-20 text-yellow-500 px-2 py-0.5 rounded">
                      Login
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Panel */}
            {profile?.is_admin && (
              <button
                onClick={() => handleNavigation('/admin', false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  pathname === '/admin'
                    ? 'bg-red-600 text-white'
                    : 'text-red-400 hover:bg-gray-800'
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
          <div className="p-4 border-t border-gray-800 bg-discord-darker">
            <div className="bg-discord-darkest rounded-lg p-3 mb-3 border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white">
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
    </>
  );
}
