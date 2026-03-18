'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  FaBell, 
  FaBars, 
  FaCoins, 
  FaGem, 
  FaMoneyBillWave, 
  FaTicketAlt, 
  FaUser, 
  FaSignOutAlt,
  FaTrophy,
  FaChartLine,
  FaGamepad,
  FaWallet,
  FaTrash
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Topbar({ onMenuClick }) {
  const { user, profile, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Refresh profile every 30 seconds to catch admin changes
      const interval = setInterval(() => {
        refreshProfile();
      }, 30000);
      return () => clearInterval(interval);
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

  const deleteAllNotifications = async () => {
    if (!confirm('🗑️ Delete all notifications?\n\nThis action cannot be undone.')) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

    // Immediately clear state
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    
      alert('✅ All notifications deleted');
    } catch (error) {
      console.error('Error deleting notifications:', error);
      alert('❌ Failed to delete notifications');
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-discord-dark border-b border-gray-800">
      <div className="flex items-center justify-between px-3 md:px-6 py-3">
        {/* Left: Menu Button + Logo */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-purple-600 hover:bg-opacity-20 rounded-lg transition-all"
          >
            <FaBars className="text-lg md:text-xl text-white" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <FaTrophy className="text-white text-sm md:text-base" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg font-bold text-white">WarriorPixel</h1>
            </div>
          </div>
        </div>

        {/* Right: Currencies, Notifications, Profile */}
        {profile ? (
          <div className="flex items-center gap-1 md:gap-2">
            {/* Currencies - Compact for mobile, full for desktop */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Real Money */}
              <div className="flex items-center gap-1 md:gap-2 bg-discord-darkest px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-700">
                <FaMoneyBillWave className="text-green-400 text-xs md:text-sm" />
                <span className="text-white font-semibold text-xs md:text-sm">
                  {parseFloat(profile.wallet_real || 0).toFixed(0)}
                </span>
              </div>

              {/* Gems */}
              <div className="flex items-center gap-1 md:gap-2 bg-discord-darkest px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-700">
                <FaGem className="text-purple-400 text-xs md:text-sm" />
                <span className="text-white font-semibold text-xs md:text-sm">
                  {parseInt(profile.wallet_gems || 0)}
                </span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1 md:gap-2 bg-discord-darkest px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-700">
                <FaCoins className="text-yellow-400 text-xs md:text-sm" />
                <span className="text-white font-semibold text-xs md:text-sm">
                  {parseInt(profile.coins || profile.wallet_coins || 0)}
                </span>
              </div>

              {/* Vouchers - Clickable */}
              <div className="relative">
                <button
                  onClick={() => setShowVouchers(!showVouchers)}
                  className="flex items-center gap-1 md:gap-2 bg-discord-darkest px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-all"
                >
                  <FaTicketAlt className="text-orange-400 text-xs md:text-sm" />
                  <span className="text-white font-semibold text-xs md:text-sm">
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
                      <div className="flex items-center gap-2 mb-3">
                        <FaTicketAlt className="text-orange-400" />
                        <h3 className="font-bold text-white">Vouchers</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-green-400 text-sm" />
                            <span className="text-discord-text text-sm">₹20 Vouchers</span>
                          </div>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_20 || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-blue-400 text-sm" />
                            <span className="text-discord-text text-sm">₹30 Vouchers</span>
                          </div>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_30 || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-purple-400 text-sm" />
                            <span className="text-discord-text text-sm">₹50 Vouchers</span>
                          </div>
                          <span className="text-white font-bold">{parseInt(profile.wallet_vouchers_50 || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-purple-600 hover:bg-opacity-20 rounded-lg transition-all"
              >
                <FaBell className="text-lg md:text-xl text-purple-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaBell className="text-purple-400" />
                          <h3 className="font-bold text-white">Notifications</h3>
                        </div>
                      </div>
                      {notifications.length > 0 && (
                        <div className="flex gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="flex-1 text-xs text-purple-400 hover:text-purple-300 font-semibold py-1 px-2 bg-purple-600 bg-opacity-10 rounded hover:bg-opacity-20 transition-all"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={deleteAllNotifications}
                            className="flex-1 text-xs text-red-400 hover:text-red-300 font-semibold py-1 px-2 bg-red-600 bg-opacity-10 rounded hover:bg-opacity-20 transition-all flex items-center justify-center gap-1"
                          >
                            <FaTrash className="text-xs" />
                            Delete all
                          </button>
                        </div>
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
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
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

            {/* Profile - Clickable */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 bg-discord-darkest px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-all"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs md:text-sm font-semibold text-white truncate max-w-[100px]">
                    {profile.username}
                  </p>
                  <p className="text-xs text-discord-text">Lv {profile.level || 1}</p>
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
                        <p className="text-xs text-discord-text flex items-center gap-1">
                          <FaUser className="text-purple-400" />
                          UID: {profile.uid}
                        </p>
                      </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2">
                          <FaChartLine className="text-blue-400" />
                          <span className="text-discord-text text-sm">Level</span>
                        </div>
                        <span className="text-white font-bold">{profile.level || 1}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2">
                          <FaTrophy className="text-purple-400" />
                          <span className="text-discord-text text-sm">Achievement Pts</span>
                        </div>
                        <span className="text-purple-400 font-bold">{profile.achievement_points || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2">
                          <FaTrophy className="text-green-400" />
                          <span className="text-discord-text text-sm">Total Wins</span>
                        </div>
                        <span className="text-green-400 font-bold">{profile.total_wins || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-discord-darkest rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2">
                          <FaGamepad className="text-blue-400" />
                          <span className="text-discord-text text-sm">Total Games</span>
                        </div>
                        <span className="text-blue-400 font-bold">{profile.total_games || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          router.push('/profile');
                        }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <FaUser />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          router.push('/wallet');
                        }}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <FaWallet />
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
          </div>
        ) : (
          <div className="text-discord-text text-sm">
            <FaUser className="text-gray-400" />
          </div>
        )}
      </div>
    </header>
  );
}
