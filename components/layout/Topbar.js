'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaBell, FaBars, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Topbar({ onMenuClick }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-glass-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Left: Menu Button (Mobile) */}
        <button
          onClick={handleMenuToggle}
          className="lg:hidden p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-smooth"
        >
          {menuOpen ? (
            <FaTimes className="text-xl text-white" />
          ) : (
            <FaBars className="text-xl text-white" />
          )}
        </button>

        {/* Center: Logo (Mobile) / Title (Desktop) */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">WP</span>
          </div>
          <h1 className="text-lg font-bold text-white">WarriorPixel</h1>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-smooth"
              >
                <FaBell className="text-xl text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
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
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden animate-slide-down">
                    <div className="p-4 border-b border-glass-border flex items-center justify-between">
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
                            className={`p-4 border-b border-glass-border cursor-pointer transition-smooth hover:bg-white hover:bg-opacity-5 ${
                              !notification.read ? 'bg-purple-500 bg-opacity-10' : ''
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

          {/* User Avatar */}
          {profile && (
            <div className="flex items-center gap-3 glass rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-red-500 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">{profile.username}</p>
                <p className="text-xs text-discord-text">Level {profile.level || 1}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
