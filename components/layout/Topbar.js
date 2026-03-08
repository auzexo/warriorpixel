'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaBell, FaBars, FaTimes, FaCoins, FaGem, FaMoneyBillWave, FaTicketAlt, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Topbar({ onMenuClick }) {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-discord-dark border-b border-gray-800">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Menu Button + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-purple-600 hover:bg-opacity-20 rounded-lg transition-all"
          >
            <FaBars className="text-xl text-white" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WP</span>
            </div>
            <h1 className="text-lg font-bold text-white">WarriorPixel</h1>
          </div>
        </div>

        {/* Right: Currencies, Notifications, Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Currencies - Show if user logged in */}
          {profile && (
            <div className="hidden md:flex items-center gap-2">
              {/* Real Money */}
              <div className="flex items-center gap-2 bg-discord-darkest px-3 py-2 rounded-lg border border-gray-700">
                <FaMoneyBillWave className="text-green-400 text-sm" />
                <span className="text-white font-semibold text-sm">
                  ₹{parseFloat(profile.wallet_real || 0).toFixed(0)}
                </span>
              </div>

              {/* Gems */}
              <div className="flex items-center gap-2 bg-discord-darkest px-3 py-2 rounded-lg border border-gray-700">
                <FaGem className="text-purple-400 text-sm" />
                <span className="text-white font-semibold text-sm">
                  {parseInt(profile.wallet_gems || 0)}
                </span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-2 bg-discord-darkest px-3 py-2 rounded-lg border border-gray-700">
                <FaCoins className="text-yellow-400 text-sm" />
                <span className="text-white font-semibold text-sm">
                  {parseInt(profile.wallet_coins || 0)}
                </span>
              </div>

              {/* Vouchers - Clickable */}
              <div className="relative">
                <button
                  onClick={() => setShowVouchers(!showVouchers)}
                  className="flex items-center gap-2 bg-discord-darkest px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-all"
                >
                  <FaTicketAlt className="text-orange-400 text-sm" />
                  <span className="text-white font-semibold text-sm">
                    {(parseInt(profile.wallet_vouchers_20 || 0) + 
                      parseInt(profile.wallet_vouchers_30 || 0) + 
                      parseInt(profile.wallet_vouchers_50 || 0))}
                  </span>
                </button>

                {/* Vouchers Dropdown */}
                {showVouchers && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowVouchers(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-discord-dark border border-gray-800 rounded-xl shadow-2xl z-50 p-4">
                      <h3 className="font-bold text-white mb-3">Vouchers</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                          <span className="text-discord-text text-sm">₹20 Vouchers</span>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_20 || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                          <span className="text-discord-text text-sm">₹30 Vouchers</span>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_30 || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                          <span className="text-discord-text text-sm">₹50 Vouchers</span>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_50 || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-purple-600 hover:bg-opacity-20 rounded-lg transition-all"
              >
                <FaBell className="text-xl text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-discord-dark border border-gray-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                      <h3 className="font-bold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <FaBell className="text-4xl text-gray-600 mx-auto mb-3" />
                          <p className="text-discord-text text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-purple-600 hover:bg-opacity-10 transition-all ${
                              !notification.read ? 'bg-purple-600 bg-opacity-5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-white text-sm mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-discord-text text-xs mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Profile - Clickable */}
          {profile && (
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 bg-discord-darkest px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white text-sm">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-white">{profile.username}</p>
                  <p className="text-xs text-discord-text">Level {profile.level || 1}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfile(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-72 bg-discord-dark border border-gray-800 rounded-xl shadow-2xl z-50 p-4">
                    {/* Profile Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white text-2xl">
                        {profile.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{profile.username}</p>
                        <p className="text-xs text-discord-text">UID: {profile.uid}</p>
                      </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                        <span className="text-discord-text text-sm">Level</span>
                        <span className="text-white font-bold">{profile.level || 1}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                        <span className="text-discord-text text-sm">Achievement Points</span>
                        <span className="text-purple-400 font-bold">{profile.achievement_points || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                        <span className="text-discord-text text-sm">Total Wins</span>
                        <span className="text-green-400 font-bold">{profile.total_wins || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg">
                        <span className="text-discord-text text-sm">Total Games</span>
                        <span className="text-blue-400 font-bold">{profile.total_games || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          router.push('/wallet');
                        }}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                      >
                        View Wallet
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
