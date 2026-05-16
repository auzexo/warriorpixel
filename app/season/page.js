'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatISTDate, getTimeLeft } from '@/lib/timeUtils';
import {
  FaFire, FaStar, FaGem, FaCrown, FaLock,
  FaCheckCircle, FaChevronLeft, FaChevronRight, FaClock,
  FaBolt, FaCalendarAlt, FaShieldAlt, FaGift
} from 'react-icons/fa';

const PASS = {
  free:    { label:'Free',    color:'text-gray-300',   bg:'bg-gray-800',   border:'border-gray-600',  icon:'🆓', btn:'' },
  premium: { label:'Premium', color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-600',icon:'💎', btn:'bg-yellow-600 hover:bg-yellow-500' },
  warrior: { label:'Warrior', color:'text-purple-400', bg:'bg-purple-900', border:'border-purple-500',icon:'⚔️', btn:'bg-purple-600 hover:bg-purple-500' },
};

const REWARD_ICON = {
  coins:'🪙', gems:'💎', xp:'⭐',
  voucher_20:'🎫', voucher_30:'🎫', voucher_50:'🎟️',
  badge:'👑', ticket:'🎮'
};

const STREAK_MILESTONES = [
  { day:7,  reward:'500 Coins',   icon:'🪙' },
  { day:14, reward:'₹20 Voucher', icon:'🎫' },
  { day:30, reward:'₹30 Voucher', icon:'🎫' },
  { day:60, reward:'30 Gems',     icon:'💎' },
  { day:90, reward:'₹50 Voucher', icon:'🎟️' },
];

export default function SeasonPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [season, setSeason] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [userSeason, setUserSeason] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [loginClaiming, setLoginClaiming] = useState(false);
  const [page, setPage] = useState(0);
  const [view, setView] = useState('pass');
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: s } = await supabase
        .from('seasons').select('*').eq('is_active', true).single();
      if (!s) { setLoading(false); return; }
      setSeason(s);

      const { data: r } = await supabase
        .from('season_rewards').select('*')
        .eq('season_id', s.id).order('tier').order('pass_type');
      setRewards(r || []);

      let { data: us } = await supabase
        .from('user_seasons').select('*')
        .eq('user_id', user.id).eq('season_id', s.id).single();
      if (!us) {
        await supabase.rpc('enroll_season', { p_user_id: user.id, p_season_id: s.id });
        us = { pass_type: 'free', current_tier: 0, season_xp: 0, claimed_tiers: [] };
      }
      setUserSeason(us);
      if (us.current_tier > 0) setPage(Math.floor((us.current_tier - 1) / 5));

      const today = new Date().toISOString().split('T')[0];
      const { data: login } = await supabase
        .from('daily_logins').select('*')
        .eq('user_id', user.id).eq('login_date', today).single();
      setLoginData(login || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleDailyLogin = async () => {
    if (!user || loginClaiming) return;
    setLoginClaiming(true);
    try {
      const { data, error } = await supabase.rpc('record_daily_login', { p_user_id: user.id });
      if (error) throw error;
      if (data.already_claimed) {
        showToast(`✅ Day ${data.streak_day} streak active! Come back tomorrow.`);
      } else {
        showToast(`🎉 Day ${data.streak_day}! +${data.reward_amount} ${data.reward_type.replace(/_/g,' ')}`);
      }
      await load();
      await refreshProfile();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setLoginClaiming(false); }
  };

  const handleClaim = async (tier, passType) => {
    if (!user || !season) return;
    const key = `${passType}_${tier}`;
    setClaiming(key);
    try {
      const { data, error } = await supabase.rpc('claim_season_reward', {
        p_user_id: user.id, p_season_id: season.id,
        p_tier: tier, p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showToast(`✅ ${data.reward}`);
      await load();
      await refreshProfile();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setClaiming(null); }
  };

  const handleUpgrade = async (passType) => {
    if (!user || !season) return;
    const cost = passType === 'premium'
      ? `${season.premium_cost_coins} coins`
      : `${season.elite_cost_gems} gems`;
    if (!confirm(`Upgrade to ${PASS[passType].label} Pass?\nCost: ${cost}`)) return;
    setUpgrading(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_season_pass', {
        p_user_id: user.id, p_season_id: season.id, p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showToast(`✅ ${PASS[passType].label} Pass activated!`);
      await load();
      await refreshProfile();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setUpgrading(false); }
  };

  const isClaimed = (tier, pt) =>
    Array.isArray(userSeason?.claimed_tiers) &&
    userSeason.claimed_tiers.includes(`${pt}_${tier}`);

  const canClaim = (tier, pt) => {
    if (!userSeason || isClaimed(tier, pt)) return false;
    if ((userSeason.current_tier || 0) < tier) return false;
    if (pt === 'premium' && !['premium','warrior'].includes(userSeason.pass_type)) return false;
    if (pt === 'warrior' && userSeason.pass_type !== 'warrior') return false;
    return true;
  };

  const hasPass = (pt) => {
    if (pt === 'free') return true;
    if (pt === 'premium') return ['premium','warrior'].includes(userSeason?.pass_type);
    return userSeason?.pass_type === 'warrior';
  };

  const getReward = (tier, pt) =>
    rewards.find(r => r.tier === tier && r.pass_type === pt);

  const TIERS_PER_PAGE = 5;
  const totalPages = season ? Math.ceil(season.max_tiers / TIERS_PER_PAGE) : 1;
  const pageTiers = season
    ? Array.from({ length: TIERS_PER_PAGE }, (_, i) => page * TIERS_PER_PAGE + i + 1)
        .filter(t => t <= season.max_tiers)
    : [];

  const currentTier = userSeason?.current_tier || 0;
  const xpProgress = ((userSeason?.season_xp || 0) % 100);
  const loginStreak = loginData?.streak_day || 0;

  if (loading) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );

  if (!season) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4 text-center">
      <div>
        <FaFire className="text-5xl text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Active Season</h2>
        <p className="text-discord-text">Check back soon!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-darkest p-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-2 rounded-xl font-bold text-white text-sm shadow-lg text-center ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-lg mx-auto">

        {/* Season Banner */}
        <div className="bg-gradient-to-br from-red-900 via-orange-900 to-red-900 border border-red-600 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <FaFire className="text-orange-400 flex-shrink-0" size={12} />
                <span className="text-orange-400 text-xs font-bold uppercase">Active Season</span>
              </div>
              <h1 className="text-lg font-bold text-white truncate">{season.name}</h1>
            </div>
            <div className="flex-shrink-0 ml-2 text-right">
              <div className="flex items-center gap-1 text-orange-300 text-xs">
                <FaClock size={10} />
                <span className="font-bold">{getTimeLeft(season.end_date)}</span>
              </div>
              <p className="text-orange-500 text-xs">90 days</p>
            </div>
          </div>
          {/* XP Progress */}
          <div className="flex justify-between text-xs text-orange-300 mb-1">
            <span>Tier {currentTier}/{season.max_tiers}</span>
            <span>{userSeason?.season_xp || 0} XP · {xpProgress}/100</span>
          </div>
          <div className="bg-red-950 rounded-full h-2">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full transition-all"
              style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        {/* View Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[
            { id:'pass',  label:'Season Pass', Icon:FaShieldAlt  },
            { id:'login', label:'Daily Login',  Icon:FaCalendarAlt },
            { id:'earn',  label:'Earn XP',      Icon:FaBolt       },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                view===v.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-discord-dark border-gray-700 text-gray-400'
              }`}>
              <v.Icon size={13} />
              {v.label}
            </button>
          ))}
        </div>

        {/* ── SEASON PASS VIEW ── */}
        {view === 'pass' && (
          <>
            {/* Pass Cards - each column fixed width */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['free','premium','warrior']).map(pt => {
                const p = PASS[pt];
                const owned = hasPass(pt);
                return (
                  <div key={pt} className={`rounded-xl border p-2 text-center ${owned ? `${p.bg} bg-opacity-30 ${p.border}` : 'bg-discord-dark border-gray-700'}`}>
                    <div className="text-xl mb-1">{p.icon}</div>
                    <p className={`font-bold text-xs mb-1 ${owned ? p.color : 'text-gray-500'}`}>{p.label}</p>
                    {owned ? (
                      <p className="text-xs text-green-400 font-bold">✓ Active</p>
                    ) : (
                      <button onClick={() => handleUpgrade(pt)} disabled={upgrading}
                        className={`text-xs px-1.5 py-1 rounded font-bold w-full ${p.btn} text-white`}>
                        {pt==='premium' ? `${season.premium_cost_coins}🪙` : `${season.elite_cost_gems}💎`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tier Navigation */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                className="p-2 bg-discord-dark border border-gray-700 rounded-lg disabled:opacity-30 text-white">
                <FaChevronLeft size={12} />
              </button>
              <span className="text-white font-bold text-sm">
                Tiers {page*TIERS_PER_PAGE+1}–{Math.min((page+1)*TIERS_PER_PAGE, season.max_tiers)} / {season.max_tiers}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1}
                className="p-2 bg-discord-dark border border-gray-700 rounded-lg disabled:opacity-30 text-white">
                <FaChevronRight size={12} />
              </button>
            </div>

            {/* Tier Rewards */}
            <div className="space-y-2">
              {pageTiers.map(tier => {
                const reached = currentTier >= tier;
                const isCurr = currentTier === tier - 1;
                return (
                  <div key={tier} className={`bg-discord-dark border rounded-xl p-3 ${
                    isCurr ? 'border-yellow-500' : reached ? 'border-green-900' : 'border-gray-800'
                  }`}>
                    {/* Tier header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${
                        reached ? 'bg-green-900 border-green-500 text-green-300' :
                        isCurr  ? 'bg-yellow-900 border-yellow-500 text-yellow-300' :
                                  'bg-gray-800 border-gray-600 text-gray-500'
                      }`}>{reached ? '✓' : tier}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${reached?'text-green-400':isCurr?'text-yellow-400':'text-gray-500'}`}>
                          Tier {tier}{isCurr && <span className="ml-1 text-yellow-500">← Current</span>}
                        </p>
                        <p className="text-xs text-gray-600">{tier * 100} Season XP required</p>
                      </div>
                    </div>

                    {/* Reward columns — each column is 1/3 width, content truncated */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['free','premium','warrior']).map(pt => {
                        const rw = getReward(tier, pt);
                        const claimed = isClaimed(tier, pt);
                        const claimable = canClaim(tier, pt);
                        const access = hasPass(pt);
                        const p = PASS[pt];
                        const key = `${pt}_${tier}`;

                        return (
                          <div key={pt} className={`rounded-lg p-1.5 text-center border min-w-0 ${
                            claimed    ? 'bg-green-900 bg-opacity-20 border-green-800' :
                            claimable  ? `${p.bg} bg-opacity-30 ${p.border}` :
                            access     ? `bg-discord-darkest ${p.border} border-opacity-20` :
                                         'bg-discord-darkest border-gray-800'
                          }`}>
                            {rw ? (
                              <>
                                <div className="text-base mb-0.5">{rw.icon || REWARD_ICON[rw.reward_type] || '🎁'}</div>
                                <p className={`text-xs font-bold leading-tight mb-1 overflow-hidden ${p.color}`}
                                   style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                                  {rw.reward_label}
                                </p>
                                {!access ? (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <FaLock size={8} className="text-gray-600" />
                                    <span className="text-xs text-gray-600">Lock</span>
                                  </div>
                                ) : claimed ? (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <FaCheckCircle size={9} className="text-green-400" />
                                    <span className="text-xs text-green-400">Done</span>
                                  </div>
                                ) : claimable ? (
                                  <button onClick={() => handleClaim(tier, pt)} disabled={claiming===key}
                                    className={`text-xs px-1.5 py-0.5 rounded font-bold w-full ${p.btn||'bg-green-600 hover:bg-green-500'} text-white`}>
                                    {claiming===key ? '...' : 'Claim'}
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <FaLock size={8} className="text-gray-600" />
                                    <span className="text-xs text-gray-600">Locked</span>
                                  </div>
                                )}
                              </>
                            ) : <span className="text-gray-700 text-xs">—</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pass value info */}
            <div className="mt-4 bg-discord-dark border border-gray-800 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div>
                  <p className="text-gray-400 font-bold mb-0.5">🆓 Free</p>
                  <p className="text-gray-500">XP + coins</p>
                  <p className="text-green-600 text-xs">Always free</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-bold mb-0.5">💎 Premium</p>
                  <p className="text-gray-500">~₹65 value</p>
                  <p className="text-yellow-600 text-xs">{season.premium_cost_coins}🪙</p>
                </div>
                <div>
                  <p className="text-purple-400 font-bold mb-0.5">⚔️ Warrior</p>
                  <p className="text-gray-500">~₹130+ value</p>
                  <p className="text-purple-600 text-xs">{season.elite_cost_gems}💎</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── DAILY LOGIN VIEW ── */}
        {view === 'login' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 border border-blue-600 rounded-xl p-4 text-center">
              <FaCalendarAlt className="text-3xl text-blue-400 mx-auto mb-2" />
              <p className="text-white font-bold text-lg mb-1">Daily Login Streak</p>
              <div className="text-5xl font-bold text-yellow-400 my-3">
                {loginStreak} <span className="text-2xl">🔥</span>
              </div>
              <p className="text-blue-300 text-sm mb-4">
                {loginData ? 'Claimed today! Come back tomorrow.' : 'Claim your daily reward!'}
              </p>
              <button onClick={handleDailyLogin} disabled={loginClaiming || !!loginData}
                className={`px-6 py-2.5 rounded-xl font-bold text-white w-full transition-all ${
                  loginData ? 'bg-gray-700 cursor-not-allowed' :
                  'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
                }`}>
                {loginClaiming ? 'Claiming...' : loginData ? '✓ Claimed Today' : '🎁 Claim Daily Reward'}
              </button>
            </div>

            {/* Milestones */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <p className="text-white font-bold mb-3 text-sm">🏆 Streak Milestones</p>
              <div className="space-y-2">
                {STREAK_MILESTONES.map(({ day, reward, icon }) => {
                  const achieved = loginStreak >= day;
                  return (
                    <div key={day} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      achieved ? 'bg-green-900 bg-opacity-20 border-green-700' :
                      loginStreak === day - 1 ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' :
                      'bg-discord-darkest border-gray-800'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 flex-shrink-0 ${
                        achieved ? 'bg-green-900 border-green-500 text-green-300' : 'bg-gray-800 border-gray-600 text-gray-500'
                      }`}>{achieved ? '✓' : `${day}d`}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold">Day {day} Streak</p>
                        <p className="text-gray-400 text-xs">{icon} {reward}</p>
                      </div>
                      {achieved && <FaCheckCircle className="text-green-400 flex-shrink-0" size={14} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── EARN XP VIEW ── */}
        {view === 'earn' && (
          <div className="space-y-3">
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                <FaBolt className="text-yellow-400" size={14} /> How to Earn Season XP
              </h3>
              <div className="space-y-2">
                {[
                  { icon:'🎮', label:'Join Tournament',   xp:'+20–50 XP' },
                  { icon:'🏆', label:'Win Tournament',    xp:'+100–200 XP' },
                  { icon:'🎯', label:'Claim Achievement', xp:'+25–75 XP' },
                  { icon:'📅', label:'Daily Login',       xp:'+25 XP (more on streak)' },
                ].map(({ icon, label, xp }) => (
                  <div key={label} className="flex items-center justify-between bg-discord-darkest rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <span className="text-white text-sm font-semibold">{label}</span>
                    </div>
                    <span className="text-yellow-400 text-xs font-bold flex-shrink-0 ml-2">{xp}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-discord-darkest rounded-lg p-2 border border-gray-800">
                <p className="text-xs text-discord-text text-center">
                  Every <strong className="text-white">100 Season XP</strong> = 1 tier · <strong className="text-white">90 tiers</strong> total this season
                </p>
              </div>
            </div>

            {/* Daily reward scale */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <p className="text-white font-bold mb-3 text-sm">📈 Daily Reward Scale</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label:'Day 1–2',   val:'30–36 coins' },
                  { label:'Day 3',     val:'56 coins + 5 gems' },
                  { label:'Day 7',     val:'500 coins 🎉' },
                  { label:'Day 14',    val:'₹20 Voucher 🎫' },
                  { label:'Day 30',    val:'₹30 Voucher 🎫' },
                  { label:'Day 60',    val:'30 Gems 💎' },
                  { label:'Day 90',    val:'₹50 Voucher 🎟️' },
                  { label:'Every 7d', val:'Gems bonus 💎' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-discord-darkest rounded-lg p-2 border border-gray-800">
                    <p className="text-gray-400 font-semibold">{label}</p>
                    <p className="text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
