'use client';

import { useAuth } from '@/context/AuthContext';
import { FaWallet, FaGem, FaCoins, FaTicketAlt, FaBars } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

const Topbar = ({ onMenuToggle }) => {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  // Calculate total vouchers
  const totalVouchers = (userProfile.wallet_vouchers_20 || 0) + 
                       (userProfile.wallet_vouchers_30 || 0) + 
                       (userProfile.wallet_vouchers_50 || 0);

  return (
    <div className="bg-primary-card border-b border-white border-opacity-5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Left side: Menu toggle + Wallet */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle Button - WORKING */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all lg:hidden"
          aria-label="Toggle menu"
        >
          <FaBars className="text-xl" />
        </button>

        {/* Mobile: Compact wallet display (All 4 currencies) */}
        <div className="flex items-center gap-2 md:hidden overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-green-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaWallet className="text-green-400 text-xs" />
            <span className="font-semibold text-xs">₹{(userProfile.wallet_real || 0).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaGem className="text-cyan-400 text-xs" />
            <span className="font-semibold text-xs">{userProfile.wallet_gems || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaCoins className="text-yellow-400 text-xs" />
            <span className="font-semibold text-xs">{userProfile.wallet_coins || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaTicketAlt className="text-purple-400 text-xs" />
            <span className="font-semibold text-xs">{totalVouchers}</span>
          </div>
        </div>

        {/* Desktop: Full wallet display (All 4 currencies) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaWallet className="text-green-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Real Money</p>
              <p className="font-bold">₹{(userProfile.wallet_real || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-cyan-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaGem className="text-cyan-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Gems</p>
              <p className="font-bold">{userProfile.wallet_gems || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaCoins className="text-yellow-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Coins</p>
              <p className="font-bold">{userProfile.wallet_coins || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaTicketAlt className="text-purple-400 text-lg" />
            <div>
              <p className="text-xs text-gray-400">Vouchers</p>
              <p className="font-bold">{totalVouchers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Real Notification Bell */}
        <NotificationBell />

        {/* User Avatar + Info */}
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
