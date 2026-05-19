'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  FaBars, FaBell, FaCoins, FaGem,
  FaMoneyBillWave, FaTicketAlt, FaCheck, FaTrash
} from 'react-icons/fa';

export default function Topbar({ onMenuClick }) {
  const { user, profile, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use refs for intervals so they are always properly cleaned up
  const notifIntervalRef = useRef(null);
  const profileIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    if (!user || !mountedRef.current) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (mountedRef.current) setNotifications(data || []);
    } catch (e) {
      // Silently fail — don't crash the topbar on network issues
      console.error('Notification load error:', e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Load immediately
    loadNotifications();

    // Clear any existing intervals before creating new ones
    if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    if (profileIntervalRef.current) clearInterval(profileIntervalRef.current);

    // Poll notifications every 20 seconds
    notifIntervalRef.current = setInterval(() => {
      if (mountedRef.current) loadNotifications();
    }, 20000);

    // Poll profile every 45 seconds (wallet updates etc)
    profileIntervalRef.current = setInterval(() => {
      if (mountedRef.current) refreshProfile();
    }, 45000);

    return () => {
      // Always clean up on unmount or user change
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
      if (profileIntervalRef.current) clearInterval(profileIntervalRef.current);
    };
  }, [user]);

  // Track mount state to prevent setState on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications')
        .update({ read: true })
        .eq('user_id', user.id).eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const deleteAll = async () => {
    if (!user || !confirm('Delete all notifications?')) return;
    try {
      await supabase.from('notifications').delete().eq('user_id', user.id);
      setNotifications([]);
      setShowNotifications(false);
    } catch (e) { console.error(e); }
  };

  return (
    <header className="bg-discord-dark border-b border-gray-800 px-3 py-2 flex items-center gap-2 sticky top-0 z-40">
      {/* Menu button */}
      <button onClick={onMenuClick} className="p-2 text-gray-400 hover:text-white md:hidden">
        <FaBars />
      </button>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">W</span>
        </div>
        <span className="text-white font-bold text-sm hidden sm:block">WarriorPixel</span>
      </Link>

      <div className="flex-1" />

      {/* Wallet display */}
      {profile && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 bg-discord-darkest border border-gray-700 rounded-lg px-2 py-1">
            <FaMoneyBillWave className="text-green-400" size={10} />
            <span className="text-green-400 text-xs font-bold">
              {parseFloat(profile.wallet_real || 0).toFixed(0)}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-discord-darkest border border-gray-700 rounded-lg px-2 py-1">
            <FaGem className="text-purple-400" size={10} />
            <span className="text-purple-400 text-xs font-bold">
              {parseInt(profile.wallet_gems || 0)}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-discord-darkest border border-gray-700 rounded-lg px-2 py-1">
            <FaCoins className="text-yellow-400" size={10} />
            <span className="text-yellow-400 text-xs font-bold">
              {parseInt(profile.wallet_coins || 0)}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-discord-darkest border border-gray-700 rounded-lg px-2 py-1">
            <FaTicketAlt className="text-blue-400" size={10} />
            <span className="text-blue-400 text-xs font-bold">
              {parseInt(profile.wallet_vouchers_20 || 0) +
               parseInt(profile.wallet_vouchers_30 || 0) +
               parseInt(profile.wallet_vouchers_50 || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {user && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setShowNotifications(v => !v);
              if (!showNotifications) loadNotifications();
            }}
            className="relative p-2 text-gray-400 hover:text-white"
          >
            <FaBell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 bg-discord-dark border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <span className="text-white font-bold text-sm">Notifications</span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={deleteAll} className="text-xs text-red-400 hover:text-red-300">
                      <FaTrash size={10} />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <FaBell className="text-3xl text-gray-600 mx-auto mb-2" />
                    <p className="text-discord-text text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id}
                      className={`px-3 py-2.5 border-b border-gray-800 hover:bg-discord-darkest cursor-pointer ${!n.read ? 'bg-blue-900 bg-opacity-10' : ''}`}
                      onClick={() => markAsRead(n.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-discord-text mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile avatar */}
      {user && profile && (
        <Link href="/profile" className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center font-bold text-white text-sm">
            {profile.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      )}
    </header>
  );
}
