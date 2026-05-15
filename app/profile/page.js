'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { countryCodes, getCountryByCode } from '@/lib/countryCodes';
import {
  FaUser, FaEdit, FaCoins, FaGem, FaMoneyBillWave, FaTicketAlt,
  FaTrophy, FaChartLine, FaGamepad, FaCrown, FaHistory, FaExchangeAlt,
  FaDiscord, FaEnvelope, FaPhone, FaIdCard, FaCheckCircle, FaTimes,
  FaSave, FaExclamationTriangle, FaStar, FaGoogle, FaLink, FaUnlink,
  FaMedal, FaShieldAlt
} from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';

const BADGE_STYLES = {
  orange: { bg:'bg-orange-900 bg-opacity-40', border:'border-orange-600', text:'text-orange-300' },
  purple: { bg:'bg-purple-900 bg-opacity-40', border:'border-purple-500', text:'text-purple-300' },
  yellow: { bg:'bg-yellow-900 bg-opacity-40', border:'border-yellow-600', text:'text-yellow-300' },
  blue:   { bg:'bg-blue-900 bg-opacity-40',   border:'border-blue-600',   text:'text-blue-300'   },
  red:    { bg:'bg-red-900 bg-opacity-40',    border:'border-red-600',    text:'text-red-300'    },
  gray:   { bg:'bg-gray-800',                 border:'border-gray-600',   text:'text-gray-300'   },
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [linkingDiscord, setLinkingDiscord] = useState(false);
  const [toast, setToast] = useState(null);

  const [editForm, setEditForm] = useState({
    username: '', email: '', phone: '', country_code: '+91', discord_id: ''
  });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Show toast if just linked Discord
    if (searchParams?.get('linked') === 'discord') {
      showToast('✅ Discord account linked successfully!');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) loadAll();
  }, [user, profile]);

  const loadAll = async () => {
    setEditForm({
      username: profile.username || '',
      email: profile.email || '',
      phone: profile.phone || '',
      country_code: profile.country_code || '+91',
      discord_id: profile.discord_id || ''
    });
    setLoading(false);

    // Load in background
    loadTournamentHistory();
    loadTransactions();
    loadBadges();
    loadIdentities();
  };

  const loadTournamentHistory = async () => {
    try {
      const { data } = await supabase
        .from('tournament_participants')
        .select('*, tournaments(tournament_name, tournament_date, entry_fee)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(10);
      setTournamentHistory(data || []);
    } catch (e) { console.error(e); }
  };

  const loadTransactions = async () => {
    try {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action_type', ['wallet_edit', 'achievement_claim', 'xp_grant'])
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(data || []);
    } catch (e) { console.error(e); }
  };

  const loadBadges = async () => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });
      setBadges(data || []);
    } catch (e) { console.error(e); }
  };

  const loadIdentities = async () => {
    try {
      const { data } = await supabase.auth.getUserIdentities();
      setIdentities(data?.identities || []);
    } catch (e) { console.error(e); }
  };

  const handleLinkDiscord = async () => {
    setLinkingDiscord(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?linking=discord`
        }
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (e) {
      showToast(`❌ ${e.message}`, 'error');
      setLinkingDiscord(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.username.trim()) { showToast('❌ Username cannot be empty', 'error'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.email && !emailRegex.test(editForm.email)) {
      showToast('❌ Invalid email format', 'error'); return;
    }

    if (editForm.phone) {
      const maxLen = getCountryByCode(editForm.country_code).maxLength;
      if (editForm.phone.length !== maxLen) {
        showToast(`❌ Phone must be ${maxLen} digits for ${getCountryByCode(editForm.country_code).name}`, 'error');
        return;
      }
    }

    setProcessing(true);
    try {
      if (editForm.discord_id && editForm.discord_id !== profile.discord_id) {
        const { data: existing } = await supabase.from('users').select('id')
          .eq('discord_id', editForm.discord_id).neq('id', user.id).single();
        if (existing) { showToast('❌ Discord ID already in use', 'error'); setProcessing(false); return; }
      }

      if (editForm.phone && (editForm.phone !== profile.phone || editForm.country_code !== profile.country_code)) {
        const { data: existing } = await supabase.from('users').select('id')
          .eq('phone', editForm.phone).eq('country_code', editForm.country_code).neq('id', user.id).single();
        if (existing) { showToast('❌ Phone already in use', 'error'); setProcessing(false); return; }
      }

      const profileComplete = !!(editForm.username && editForm.email && editForm.phone && editForm.discord_id);
      const { error } = await supabase.from('users').update({
        username: editForm.username,
        email: editForm.email || null,
        phone: editForm.phone || null,
        country_code: editForm.country_code,
        discord_id: editForm.discord_id || null,
        is_verified: profileComplete,
        profile_completed_at: profileComplete && !profile.is_verified ? new Date().toISOString() : profile.profile_completed_at
      }).eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setShowEditModal(false);
      showToast(profileComplete && !profile.is_verified ? '✅ Profile verified! Badge earned! 🎉' : '✅ Profile updated!');
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setProcessing(false); }
  };

  const xpProgress = Math.min(100, ((profile?.xp || 0) / (profile?.xp_to_next_level || 100)) * 100);
  const discordLinked = identities.some(i => i.provider === 'discord');
  const googleLinked = identities.some(i => i.provider === 'google');

  if (!user || !profile) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
      <div className="text-center">
        <FaUser className="text-5xl text-gray-600 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">Login Required</p>
        <p className="text-discord-text text-sm">Login to view your profile</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-darkest p-3 overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl font-bold text-white text-sm shadow-lg max-w-xs text-center ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* ── Profile Header ── */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 mb-4 border border-purple-600">
          {!profile.is_verified && (
            <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg px-3 py-2 mb-3">
              <p className="text-yellow-400 text-xs flex items-center gap-2">
                <FaExclamationTriangle />
                Complete your profile (email, phone, Discord) to get a verified badge!
              </p>
            </div>
          )}

          <div className="flex flex-col items-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white text-4xl border-4 border-purple-400 shadow-lg mb-3">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2 mb-1">
                {profile.username}
                {profile.is_verified && <FaCheckCircle className="text-blue-400 text-xl" />}
              </h1>
              {/* Badges inline under name */}
              {badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                  {badges.map(badge => {
                    const s = BADGE_STYLES[badge.badge_color] || BADGE_STYLES.gray;
                    return (
                      <span key={badge.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${s.bg} ${s.border} ${s.text}`}>
                        {badge.badge_icon} {badge.badge_name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1 text-sm mb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-200">
              <FaIdCard className="text-purple-400" />
              <span>UID: {profile.uid}</span>
            </div>
            {profile.email && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <FaEnvelope className="text-purple-400" />
                <span className="truncate max-w-xs">{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <FaPhone className="text-purple-400" />
                <span>{profile.country_code || '+91'} {profile.phone}</span>
              </div>
            )}
            {profile.discord_id && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <FaDiscord className="text-purple-400" />
                <span>{profile.discord_id}</span>
              </div>
            )}
          </div>

          {/* Edit button */}
          <div className="flex justify-center mb-4">
            <button onClick={() => setShowEditModal(true)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2">
              <FaEdit /> Edit Profile
            </button>
          </div>

          {/* XP Bar */}
          <div className="bg-purple-900 bg-opacity-40 rounded-lg p-3">
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <FaStar className="text-yellow-400" />
                <span className="text-white font-bold">Level {profile.level || 1}</span>
              </div>
              <span className="text-purple-200">{profile.xp || 0} / {profile.xp_to_next_level || 100} XP</span>
            </div>
            <div className="w-full bg-purple-950 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-yellow-400 to-purple-400 h-full rounded-full transition-all"
                style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        {/* ── Season Badges Section ── */}
        {badges.length > 0 && (
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-4">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <FaMedal className="text-yellow-400" />
              Season Badges
              <span className="text-xs text-discord-text font-normal">({badges.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map(badge => {
                const s = BADGE_STYLES[badge.badge_color] || BADGE_STYLES.gray;
                return (
                  <div key={badge.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.bg} ${s.border}`}>
                    <span className="text-2xl">{badge.badge_icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${s.text}`}>{badge.badge_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{badge.badge_tier} Pass</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Account Linking ── */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <FaLink className="text-blue-400" />
            Linked Accounts
          </h2>
          <div className="space-y-2">
            {/* Google */}
            <div className="flex items-center justify-between bg-discord-darkest rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <span className="text-base">G</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Google</p>
                  <p className={`text-xs ${googleLinked ? 'text-green-400' : 'text-gray-500'}`}>
                    {googleLinked ? '✓ Linked' : 'Not linked'}
                  </p>
                </div>
              </div>
              {googleLinked
                ? <span className="text-xs bg-green-900 text-green-400 border border-green-700 px-2 py-1 rounded">Active</span>
                : <span className="text-xs text-gray-500">—</span>
              }
            </div>

            {/* Discord */}
            <div className="flex items-center justify-between bg-discord-darkest rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <FaDiscord className="text-white" size={16} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Discord</p>
                  <p className={`text-xs ${discordLinked ? 'text-green-400' : 'text-gray-500'}`}>
                    {discordLinked ? `✓ ${profile.discord_id || 'Linked'}` : 'Not linked'}
                  </p>
                </div>
              </div>
              {discordLinked ? (
                <span className="text-xs bg-indigo-900 text-indigo-400 border border-indigo-700 px-2 py-1 rounded">Active</span>
              ) : (
                <button onClick={handleLinkDiscord} disabled={linkingDiscord}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-all">
                  <FaLink size={10} />
                  {linkingDiscord ? 'Linking...' : 'Link'}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Link multiple accounts to sign in using either Google or Discord
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { Icon:FaChartLine, color:'text-blue-400',   label:'Level',          val:profile.level || 1 },
            { Icon:FaTrophy,    color:'text-purple-400', label:'Achievement Pts', val:profile.achievement_points || 0 },
            { Icon:FaCrown,     color:'text-yellow-400', label:'Total Wins',      val:profile.total_wins || 0 },
            { Icon:FaGamepad,   color:'text-green-400',  label:'Total Games',     val:profile.total_games || 0 },
          ].map(({ Icon, color, label, val }) => (
            <div key={label} className="bg-discord-dark border border-gray-800 rounded-lg p-3 text-center">
              <Icon className={`text-2xl ${color} mx-auto mb-1`} />
              <p className="text-xs text-discord-text mb-0.5">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* ── Wallet ── */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <FaCoins className="text-yellow-400" /> Wallet
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { Icon:FaMoneyBillWave, color:'text-green-400',  label:'Real Money',  val:`₹${parseFloat(profile.wallet_real||0).toFixed(2)}` },
              { Icon:FaCoins,         color:'text-yellow-400', label:'Coins',        val:parseInt(profile.wallet_coins||0) },
              { Icon:FaGem,           color:'text-purple-400', label:'Gems',         val:parseInt(profile.wallet_gems||0) },
              { Icon:FaTicketAlt,     color:'text-blue-400',   label:'₹20 Voucher',  val:parseInt(profile.wallet_vouchers_20||0) },
              { Icon:FaTicketAlt,     color:'text-orange-400', label:'₹30 Voucher',  val:parseInt(profile.wallet_vouchers_30||0) },
              { Icon:FaTicketAlt,     color:'text-red-400',    label:'₹50 Voucher',  val:parseInt(profile.wallet_vouchers_50||0) },
            ].map(({ Icon, color, label, val }) => (
              <div key={label} className="bg-discord-darkest rounded-lg p-3 text-center border border-gray-700">
                <Icon className={`text-2xl ${color} mx-auto mb-1`} />
                <p className="text-xs text-discord-text mb-0.5">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tournament History ── */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <FaHistory className="text-blue-400" /> Tournament History
          </h2>
          {tournamentHistory.length === 0 ? (
            <div className="text-center py-6">
              <FaTrophy className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-discord-text text-sm">No tournament history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tournamentHistory.map(reg => (
                <div key={reg.id} className="bg-discord-darkest rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-semibold text-sm truncate">{reg.tournaments?.tournament_name || 'Tournament'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      reg.status==='confirmed'?'bg-green-600':reg.status==='pending'?'bg-yellow-600':'bg-gray-600'
                    } text-white`}>{reg.status}</span>
                  </div>
                  <p className="text-xs text-discord-text">Entry: ₹{reg.tournaments?.entry_fee||0} · {new Date(reg.registered_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Transactions ── */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <FaExchangeAlt className="text-purple-400" /> Recent Transactions
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <FaExchangeAlt className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-discord-text text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-discord-darkest rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-white font-semibold text-sm capitalize">{tx.action_type.replace(/_/g,' ')}</span>
                    <span className="text-xs text-discord-text">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-discord-text truncate">
                    {typeof tx.details === 'string' ? tx.details : JSON.stringify(tx.details)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-md w-full p-5 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaEdit className="text-purple-400" /> Edit Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white text-sm font-semibold block mb-1">Username *</label>
                <input type="text" value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2.5 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-purple-600"
                  placeholder="Enter username" />
              </div>
              <div>
                <label className="text-white text-sm font-semibold block mb-1">Email</label>
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-purple-600"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-white text-sm font-semibold block mb-1">Phone</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={editForm.country_code}
                    onChange={e => setEditForm({...editForm, country_code: e.target.value, phone: ''})}
                    className="px-2 py-2.5 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-purple-600">
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input type="tel" maxLength={getCountryByCode(editForm.country_code).maxLength}
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value.replace(/\D/g,'')})}
                    className="col-span-2 px-3 py-2.5 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-purple-600"
                    placeholder={`${getCountryByCode(editForm.country_code).maxLength} digits`} />
                </div>
              </div>
              <div>
                <label className="text-white text-sm font-semibold block mb-1">Discord ID</label>
                <input type="text" value={editForm.discord_id}
                  onChange={e => setEditForm({...editForm, discord_id: e.target.value})}
                  className="w-full px-3 py-2.5 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-purple-600"
                  placeholder="username or ID" />
              </div>
              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-2.5">
                <p className="text-blue-400 text-xs flex items-center gap-1.5">
                  <FaCheckCircle size={10} />
                  Fill all fields to earn your verified badge!
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEditModal(false)} disabled={processing}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm">
                Cancel
              </button>
              <button onClick={handleUpdateProfile} disabled={processing}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                {processing ? <><div className="animate-spin h-4 w-4 rounded-full border-b-2 border-white" />Saving...</> : <><FaSave />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
