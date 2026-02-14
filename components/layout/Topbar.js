'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaWallet } from 'react-icons/fa';

export default function Topbar({ onMenuClick }) {
  const { user, profile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) {
      loadNotifications();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    loadNotifications();
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false);

    loadNotifications();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="bg-discord-dark border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
      >
        <FaBars className="text-xl text-white" />
      </button>

      {/* Center: Currencies */}
      {profile && (
        <div className="flex-1 flex items-center justify-center gap-2 mx-4 overflow-x-auto">
          {/* Mobile: Compact */}
          <div className="flex md:hidden gap-2">
            <div className="bg-green-600 bg-opacity-20 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
              <span className="text-green-400 text-xs">₹</span>
              <span className="text-white text-xs font-bold">{parseFloat(profile.wallet_real || 0).toFixed(0)}</span>
            </div>
            <div className="bg-cyan-600 bg-opacity-20 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
              <span className="text-cyan-400 text-xs">💎</span>
              <span className="text-white text-xs font-bold">{profile.wallet_gems || 0}</span>
            </div>
            <div className="bg-yellow-600 bg-opacity-20 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
              <span className="text-yellow-400 text-xs">🪙</span>
              <span className="text-white text-xs font-bold">{profile.wallet_coins || 0}</span>
            </div>
            <div className="bg-purple-600 bg-opacity-20 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
              <span className="text-purple-400 text-xs">🎫</span>
              <span className="text-white text-xs font-bold">
                {(profile.wallet_vouchers_20 || 0) + (profile.wallet_vouchers_30 || 0) + (profile.wallet_vouchers_50 || 0)}
              </span>
            </div>
          </div>

          {/* Desktop: Full Cards */}
          <div className="hidden md:flex gap-3">
            <div className="bg-green-600 bg-opacity-20 px-3 py-2 rounded-lg">
              <p className="text-xs text-green-400">Real Money</p>
              <p className="text-white font-bold">₹{parseFloat(profile.wallet_real || 0).toFixed(2)}</p>
            </div>
            <div className="bg-cyan-600 bg-opacity-20 px-3 py-2 rounded-lg">
              <p className="text-xs text-cyan-400">Gems</p>
              <p className="text-white font-bold">{profile.wallet_gems || 0}</p>
            </div>
            <div className="bg-yellow-600 bg-opacity-20 px-3 py-2 rounded-lg">
              <p className="text-xs text-yellow-400">Coins</p>
              <p className="text-white font-bold">{profile.wallet_coins || 0}</p>
            </div>
            <div className="bg-purple-600 bg-opacity-20 px-3 py-2 rounded-lg">
              <p className="text-xs text-purple-400">Vouchers</p>
              <p className="text-white font-bold">
                {(profile.wallet_vouchers_20 || 0) + (profile.wallet_vouchers_30 || 0) + (profile.wallet_vouchers_50 || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2">
        {profile && (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all relative"
              >
                <FaBell className="text-xl text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-w-[90vw] bg-discord-dark border border-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && markAsRead(notif.id)}
                          className={`p-4 border-b border-gray-800 hover:bg-white hover:bg-opacity-5 cursor-pointer ${
                            !notif.read ? 'bg-purple-500 bg-opacity-10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.read && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 flex-shrink-0"></div>}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white text-sm">{notif.title}</h4>
                              <p className="text-discord-text text-xs mt-1 break-words">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.created_at).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-discord-text">
                        <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
              >
                <FaUserCircle className="text-2xl text-white" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-56 bg-discord-dark border border-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-800">
                    <p className="font-bold text-white truncate">{profile.username}</p>
                    <p className="text-xs text-discord-text truncate">{profile.uid}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => window.location.href = '/wallet'}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all text-left"
                    >
                      <FaWallet className="text-green-400" />
                      <span className="text-white">Wallet</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all text-left"
                    >
                      <FaSignOutAlt className="text-red-400" />
                      <span className="text-white">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Click Outside to Close */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </div>
  );
          }
