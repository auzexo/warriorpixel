// components/Topbar.js
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { FaBars, FaBell, FaGem, FaCoins, FaTicketAlt, FaWallet } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

const Topbar = ({ onMenuClick, pageTitle }) => {
  const { userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const wallet = {
    real: userProfile?.wallet_real || 0,
    gems: userProfile?.wallet_gems || 0,
    coins: userProfile?.wallet_coins || 0,
    vouchers: (userProfile?.wallet_vouchers_20 || 0) + 
              (userProfile?.wallet_vouchers_30 || 0) + 
              (userProfile?.wallet_vouchers_50 || 0)
  };

  return (
    <header className="h-18 bg-primary-darker border-b border-white border-opacity-5 sticky top-0 z-30 backdrop-blur-lg">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white hover:bg-opacity-5 rounded-lg transition-all"
          >
            <FaBars className="text-xl" />
          </button>

          <h1 className="text-base md:text-lg font-bold tracking-wide">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop Wallet Display */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
              <FaWallet className="text-green-400 text-sm" />
              <span className="font-semibold text-green-400 text-sm">₹{wallet.real.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
              <FaGem className="text-cyan-400 text-sm" />
              <span className="font-semibold text-cyan-400 text-sm">{wallet.gems}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
              <FaCoins className="text-yellow-400 text-sm" />
              <span className="font-semibold text-yellow-400 text-sm">{wallet.coins}</span>
            </div>

            {wallet.vouchers > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
                <FaTicketAlt className="text-purple-400 text-sm" />
                <span className="font-semibold text-purple-400 text-sm">{wallet.vouchers}</span>
              </div>
            )}
          </div>

          {/* Mobile Wallet Display */}
          <div className="md:hidden flex items-center gap-1">
            <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-5 rounded text-xs">
              <FaWallet className="text-green-400" />
              <span className="font-semibold text-green-400">₹{wallet.real.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-5 rounded text-xs">
              <FaGem className="text-cyan-400" />
              <span className="font-semibold text-cyan-400">{wallet.gems}</span>
            </div>
          </div>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-white hover:bg-opacity-5 rounded-lg transition-all"
          >
            <FaBell className="text-lg md:text-xl text-gray-400 hover:text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              0
            </span>
          </button>

          <div className="relative ml-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-purple-500 cursor-pointer">
              <Image
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="Avatar"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="absolute right-4 md:right-6 top-20 w-72 md:w-80 bg-primary-card rounded-lg border border-white border-opacity-10 shadow-2xl p-4 z-50">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <FaBell className="text-yellow-400" />
            Notifications
          </h3>
          <div className="text-gray-400 text-sm text-center py-8">
            No new notifications
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
