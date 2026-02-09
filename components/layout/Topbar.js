'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FaWallet, FaGem, FaCoins, FaTicketAlt, FaBars, FaBell, FaUserCircle, FaChevronDown } from 'react-icons/fa';

export default function Topbar({ onMenuToggle }) {
  const { profile, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!profile) return null;

  const totalVouchers =
    (profile.wallet_vouchers_20 || 0) +
    (profile.wallet_vouchers_30 || 0) +
    (profile.wallet_vouchers_50 || 0);

  return (
    <div className="bg-discord-dark border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Menu + Currencies */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all lg:hidden"
        >
          <FaBars className="text-xl" />
        </button>

        {/* Mobile: Compact Currencies */}
        <div className="flex items-center gap-2 md:hidden overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-green-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaWallet className="text-green-400 text-xs" />
            <span className="font-semibold text-xs">₹{(profile.wallet_real || 0).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaGem className="text-cyan-400 text-xs" />
            <span className="font-semibold text-xs">{profile.wallet_gems || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaCoins className="text-yellow-400 text-xs" />
            <span className="font-semibold text-xs">{profile.wallet_coins || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-600 bg-opacity-20 px-2 py-1 rounded-lg whitespace-nowrap">
            <FaTicketAlt className="text-purple-400 text-xs" />
            <span className="font-semibold text-xs">{totalVouchers}</span>
          </div>
        </div>

        {/* Desktop: Full Currencies */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaWallet className="text-green-400 text-lg" />
            <div>
              <p className="text-xs text-discord-text">Real Money</p>
              <p className="font-bold text-white">₹{(profile.wallet_real || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-cyan-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaGem className="text-cyan-400 text-lg" />
            <div>
              <p className="text-xs text-discord-text">Gems</p>
              <p className="font-bold text-white">{profile.wallet_gems || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaCoins className="text-yellow-400 text-lg" />
            <div>
              <p className="text-xs text-discord-text">Coins</p>
              <p className="font-bold text-white">{profile.wallet_coins || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-600 bg-opacity-20 px-4 py-2 rounded-lg">
            <FaTicketAlt className="text-purple-400 text-lg" />
            <div>
              <p className="text-xs text-discord-text">Vouchers</p>
              <p className="font-bold text-white">{totalVouchers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            0
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-white hover:bg-opacity-10 rounded-lg p-2 transition-all"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
              {profile.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="font-semibold text-sm text-white">{profile.username}</p>
              <p className="text-xs text-discord-text">{profile.achievement_points || 0} pts</p>
            </div>
            <FaChevronDown className="text-xs text-discord-text" />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-56 bg-discord-dark rounded-lg shadow-2xl border border-gray-800 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-800">
                <p className="font-semibold text-white">{profile.username}</p>
                <p className="text-xs text-discord-text">UID: {profile.uid}</p>
              </div>
              <div className="p-2">
                <button className="w-full text-left px-4 py-2 hover:bg-white hover:bg-opacity-5 rounded text-sm text-white">
                  <FaUserCircle className="inline mr-2" />
                  View Profile
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-white hover:bg-opacity-5 rounded text-sm text-white">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-white hover:bg-opacity-5 rounded text-sm text-white">
                  Link Discord
                </button>
                <hr className="my-2 border-gray-800" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-red-600 hover:bg-opacity-20 rounded text-sm text-red-400"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
