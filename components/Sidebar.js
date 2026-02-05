'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaHome, FaTrophy, FaFire, FaCube, FaShoppingCart, FaWallet, FaInfoCircle, FaDownload, FaCrown, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

const Sidebar = ({ isOpen, onClose }) => {  // ✅ ADDED PROPS HERE
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout } = useAuth();

  const menuItems = [
    { icon: FaHome, label: 'Home', path: '/' },
    { icon: FaTrophy, label: 'Tournaments', path: '/tournaments' },
    { icon: FaFire, label: 'Free Fire', path: '/freefire' },
    { icon: FaCube, label: 'Minecraft', path: '/minecraft' },
    { icon: FaShoppingCart, label: 'Shop', path: '/shop' },
    { icon: FaWallet, label: 'Wallet', path: '/wallet' },
    { icon: FaInfoCircle, label: 'Info & Help', path: '/info' },
    { icon: FaDownload, label: 'Download App', path: '/download' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    if (onClose) onClose(); // ✅ Close sidebar on mobile after navigation
  };

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose(); // ✅ Close sidebar after logout
  };

  return (
    <>
      {/* Sidebar - Now responds to isOpen prop */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-primary-card border-r border-white border-opacity-5 w-64 flex flex-col z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Close button for mobile - Now works! */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all z-50"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-white border-opacity-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FaTrophy className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">WarriorPixel</h1>
              <p className="text-xs text-gray-400">Gaming Platform</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
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
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-white hover:bg-opacity-5 text-gray-300'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            {/* Admin Panel - Only for admins */}
            {userProfile?.is_admin && (
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
        <div className="p-4 border-t border-white border-opacity-5">
          <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{userProfile?.username}</p>
                <p className="text-xs text-gray-400">{userProfile?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Level {userProfile?.level || 1}</span>
              <span className="text-purple-400">{userProfile?.achievement_points || 0} pts</span>
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
      </aside>
    </>
  );
};

export default Sidebar;
