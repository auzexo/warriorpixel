'use client';

import { useAuth } from '@/context/AuthContext';
import { FaWallet, FaGem, FaCoins, FaBars } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

const Topbar = ({ onMenuToggle }) => {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  return (
    <div className="bg-primary-card border-b border-white border-opacity-5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Left side: Menu toggle + Wallet */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all lg:hidden"
          aria-label="Toggle menu"
        >
          <FaBars className="text-xl" />
        </button>

        {/* Mobile: Compact wallet display */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-2 bg-green-600 bg-opacity-20 px-3 py-1.5 rounded-lg">
            <FaWallet className="text-green-400 text-sm" />
            <span className="font-semibold text-sm">₹{(userProfile.wallet_real || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 bg-cyan-600 bg-opacity-20 px-3 py-1.5 rounded-lg">
            <FaGem className="text-cyan-400 text-sm" />
            <span className="font-semibold text-sm">{userProfile.wallet_gems || 0}</span>
          </div>
        </div>

        {/* Desktop: Full wallet display */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaWallet className="text-green-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Real Money</p>
              <p className="font-bold">₹{(userProfile.wallet_real || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaCoins className="text-yellow-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Coins</p>
              <p className="font-bold">{userProfile.wallet_coins || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-cyan-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaGem className="text-cyan-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Gems</p>
              <p className="font-bold">{userProfile.wallet_gems || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Real Notification Bell */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white">
            {userProfile.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="font-semibold text-sm">{userProfile.username}</p>
            <p className="text-xs text-gray-400">{userProfile.achievement_points || 0} pts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
