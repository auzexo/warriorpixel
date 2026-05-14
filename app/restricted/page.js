'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaBan, FaHome, FaVideo, FaInfoCircle, FaQuestionCircle, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

// Manual UTC+5:30 — works on ALL devices
const toIST = (utcString) => {
  if (!utcString) return 'Unknown';
  try {
    const d = new Date(new Date(utcString).getTime() + (5 * 60 + 30) * 60 * 1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2,'0');
    const ampm = h >= 12 ? 'pm' : 'am';
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h % 12 || 12}:${m} ${ampm} IST`;
  } catch { return 'Unknown'; }
};

export default function RestrictedPage() {
  const { user } = useAuth();
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadBanStatus();
    else setLoading(false);
  }, [user]);

  const loadBanStatus = async () => {
    try {
      const { data: bans } = await supabase
        .from('user_bans').select('*')
        .eq('user_id', user.id).eq('is_active', true);
      const activeBan = bans?.find(ban => {
        if (ban.ban_type === 'permanent') return true;
        if (ban.ban_type === 'temporary' && ban.expires_at)
          return new Date(ban.expires_at) > new Date();
        return false;
      });
      setBanStatus(activeBan || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  if (!user || !banStatus) return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-discord-dark border border-green-600 rounded-xl p-8 text-center">
        <FaExclamationTriangle className="text-5xl text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-4">{!user ? 'Not Logged In' : 'Account Active'}</h1>
        <p className="text-discord-text mb-6">{!user ? 'Please log in.' : 'Your account is in good standing.'}</p>
        <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold inline-block">Go to Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-discord-dark border border-red-600 rounded-xl p-8 text-center mb-6">
          <FaBan className="text-7xl text-red-400 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-bold text-white mb-4">
            {banStatus.ban_type === 'permanent' ? 'Account Banned' : 'Account Suspended'}
          </h1>
          <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-5 mb-6">
            <p className="text-red-300 text-lg mb-3"><strong>Reason:</strong> {banStatus.reason}</p>
            {banStatus.ban_type === 'temporary' && banStatus.expires_at && (
              <p className="text-red-300 text-lg mb-3"><strong>Expires:</strong> {toIST(banStatus.expires_at)}</p>
            )}
            <p className="text-sm text-red-400">Banned on: {toIST(banStatus.created_at)}</p>
          </div>
          <div className={`${banStatus.ban_type === 'permanent' ? 'bg-red-900 border-red-700' : 'bg-orange-900 border-orange-600'} bg-opacity-20 border rounded-lg p-4 mb-6`}>
            <p className={`${banStatus.ban_type === 'permanent' ? 'text-red-300' : 'text-orange-300'} text-sm`}>
              <FaExclamationTriangle className="inline mr-2" />
              {banStatus.ban_type === 'permanent'
                ? 'This is a permanent ban. Your access to tournaments and competitive features is permanently restricted.'
                : 'This is a temporary suspension. Full access will be restored when the suspension expires.'}
            </p>
          </div>
          <p className="text-discord-text mb-6 text-base">
            Your access to tournaments, wallet features, and competitive functions has been restricted. You can still browse limited sections of the platform.
          </p>
        </div>

        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-2 text-center">📖 You Can Still Access</h2>
          <p className="text-discord-text text-center mb-6 text-sm">Browse these sections while your account has restricted access</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { href:'/', Icon:FaHome, color:'text-blue-400', label:'Home', sub:'Main page' },
              { href:'/videos', Icon:FaVideo, color:'text-red-400', label:'Videos', sub:'Watch content' },
              { href:'/info', Icon:FaInfoCircle, color:'text-green-400', label:'Info', sub:'Platform info' },
              { href:'/help', Icon:FaQuestionCircle, color:'text-yellow-400', label:'Help', sub:'Support center' },
              { href:'/downloads', Icon:FaDownload, color:'text-purple-400', label:'Downloads', sub:'Get files' },
              { href:'/about', Icon:FaInfoCircle, color:'text-cyan-400', label:'About', sub:'About us' },
            ].map(({href, Icon, color, label, sub}) => (
              <Link key={href} href={href} className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600">
                <Icon className={`text-3xl ${color} mx-auto mb-3`} />
                <p className="text-white font-semibold text-sm mb-1">{label}</p>
                <p className="text-discord-text text-xs">{sub}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-discord-dark border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-sm text-discord-text mb-2">If you believe this is a mistake, please contact support.</p>
          <Link href="/help" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm">
            <FaQuestionCircle /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
