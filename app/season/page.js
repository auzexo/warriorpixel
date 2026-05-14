'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatISTDate, getTimeLeft } from '@/lib/timeUtils';
import {
  FaFire, FaStar, FaGem, FaCoins, FaCrown, FaLock,
  FaCheckCircle, FaChevronLeft, FaChevronRight, FaClock,
  FaBolt, FaCalendarAlt, FaGift, FaShieldAlt
} from 'react-icons/fa';

const PASS = {
  free:    { label:'Free Pass',    color:'text-gray-300',   bg:'bg-gray-800',   border:'border-gray-600',  icon:'🆓', btnClass:'' },
  premium: { label:'Premium Pass', color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-600',icon:'💎', btnClass:'bg-yellow-600 hover:bg-yellow-500' },
  warrior: { label:'Warrior Pass', color:'text-purple-400', bg:'bg-purple-900', border:'border-purple-500',icon:'⚔️', btnClass:'bg-purple-600 hover:bg-purple-500' },
};

const REWARD_ICON = { coins:'🪙', gems:'💎', xp:'⭐', voucher_20:'🎫', voucher_30:'🎫', voucher_50:'🎟️', badge:'👑', ticket:'🎮' };

const STREAK_MILESTONES = [7, 14, 30, 60, 90];
const STREAK_REWARDS = {
  7:  { label:'500 Coins',       icon:'🪙', desc:'7-day streak bonus!' },
  14: { label:'₹20 Voucher',     icon:'🎫', desc:'2-week warrior reward!' },
  30: { label:'₹30 Voucher',     icon:'🎫', desc:'Monthly champion reward!' },
  60: { label:'30 Gems',         icon:'💎', desc:'60-day legend reward!' },
  90: { label:'₹50 Voucher',     icon:'🎟️', desc:'Season Veteran reward!' },
};

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
  const [page, setPage] = useState(0); // 5 tiers per page
  const [activeView, setActiveView] = useState('pass'); // 'pass' | 'login' | 'missions'
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: s } = await supabase.from('seasons').select('*').eq('is_active', true).single();
      if (!s) { setLoading(false); return; }
      setSeason(s);

      const { data: r } = await supabase.from('season_rewards').select('*')
        .eq('season_id', s.id).order('tier').order('pass_type');
      setRewards(r || []);

      let { data: us } = await supabase.from('user_seasons').select('*')
        .eq('user_id', user.id).eq('season_id', s.id).single();
      if (!us) {
        await supabase.rpc('enroll_season', { p_user_id: user.id, p_season_id: s.id });
        us = { pass_type:'free', current_tier:0, season_xp:0, claimed_tiers:[] };
      }
      setUserSeason(us);
      if (us.current_tier > 0) setPage(Math.floor((us.current_tier - 1) / 5));

      // Load today's login
      const today = new Date().toISOString().split('T')[0];
      const { data: login } = await supabase.from('daily_logins')
        .select('*').eq('user_id', user.id).eq('login_date', today).single();
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
        showToast(`🎉 Day ${data.streak_day} streak! +${data.reward_amount} ${data.reward_type.replace('_',' ')} & +${data.season_xp} Season XP`);
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
        p_user_id: user.id, p_season_id: season.id, p_tier: tier, p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showToast(`✅ Claimed: ${data.reward}`);
      await load();
      await refreshProfile();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setClaiming(null); }
  };

  const handleUpgrade = async (passType) => {
    if (!user || !season) return;
    const costLabel = passType === 'premium' ? `${season.premium_cost_coins} coins` : `${season.elite_cost_gems} gems`;
    if (!confirm(`Upgrade to ${PASS[passType].label}?\nCost: ${costLabel}`)) return;
    setUpgrading(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_season_pass', {
        p_user_id: user.id, p_season_id: season.id, p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showToast(`✅ Upgraded to ${PASS[passType].label}!`);
      await load();
      await refreshProfile();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setUpgrading(false); }
  };

  const isClaimed = (tier, passType) =>
    Array.isArray(userSeason?.claimed_tiers) && userSeason.claimed_tiers.includes(`${passType}_${tier}`);

  const canClaim = (tier, passType) => {
    if (!userSeason || isClaimed(tier, passType)) return false;
    if ((userSeason.current_tier || 0) < tier) return false;
    if (passType === 'premium' && !['premium','warrior'].includes(userSeason.pass_type)) return false;
    if (passType === 'warrior' && userSeason.pass_type !== 'warrior') return false;
    return true;
  };

  const hasPass = (passType) => {
    if (passType === 'free') return true;
    if (passType === 'premium') return ['premium','warrior'].includes(userSeason?.pass_type);
    return userSeason?.pass_type === 'warrior';
  };

  const getReward = (tier, passType) => rewards.find(r => r.tier === tier && r.pass_type === passType);

  const xpProgress = ((userSeason?.season_xp || 0) % 100);
  const currentTier = userSeason?.current_tier || 0;
  const tiersPerPage = 5;
  const totalPages = season ? Math.ceil(season.max_tiers / tiersPerPage) : 1;
  const pageTiers = Array.from({ length: tiersPerPage }, (_, i) => page * tiersPerPage + i + 1)
    .filter(t => season && t <= season.max_tiers);

  const todayLogin = loginData;
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
        <p className="text-discord-text">Check back soon for the next season!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-darkest p-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl font-bold text-white text-sm shadow-lg max-w-xs text-center ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-lg mx-auto">
        {/* Season Banner */}
        <div className="bg-gradient-to-br from-red-900 via-orange-900 to-red-900 border border-red-600 rounded-xl p-4 mb-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-7xl opacity-10 pointer-events-none select-none">🔥</div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <FaFire className="text-orange-400" size={12} />
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Active Season</span>
              </div>
              <h1 className="text-xl font-bold text-white">{season.name}</h1>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="flex items-center gap-1 text-orange-300 text-xs">
                <FaClock size={10} />
                <span className="font-bold">{getTimeLeft(season.end_date)}</span>
              </div>
              <p className="text-orange-500 text-xs">90-day season</p>
            </div>
          </div>
          {/* XP Progress */}
          {userSeason && (
            <div>
              <div className="flex justify-between text-xs text-orange-300 mb-1">
                <span>Tier {currentTier}/{season.max_tiers}</span>
                <span>{userSeason.season_xp || 0} Season XP · {xpProgress}/100 to next</span>
              </div>
              <div className="w-full bg-red-950 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full transition-all"
                  style={{ width:`${xpProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* View Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[
            { id:'pass',     label:'Season Pass', Icon:FaShieldAlt },
            { id:'login',    label:'Daily Login', Icon:FaCalendarAlt },
            { id:'missions', label:'Missions',    Icon:FaBolt },
          ].map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                activeView===v.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-discord-dark border-gray-700 text-gray-400'
              }`}>
              <v.Icon size={14} />
              {v.label}
            </button>
          ))}
        </div>

        {/* ─── SEASON PASS VIEW ─── */}
        {activeView === 'pass' && (
          <>
            {/* Pass Cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['free','premium','warrior']).map(pt => {
                const p = PASS[pt];
                const owned = hasPass(pt);
                return (
                  <div key={pt} className={`rounded-xl border p-3 text-center ${owned ? `${p.bg} bg-opacity-30 ${p.border}` : 'bg-discord-dark border-gray-700'}`}>
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <p className={`font-bold text-xs mb-1 ${owned ? p.color : 'text-gray-500'}`}>{p.label}</p>
                    {owned ? (
                      <span className="text-xs text-green-400 font-bold">✓ Active</span>
                    ) : (
                      <button onClick={() => handleUpgrade(pt)} disabled={upgrading || pt==='free'}
                        className={`text-xs px-2 py-1 rounded font-bold w-full transition-all ${p.btnClass} text-white`}>
                        {pt==='premium' ? `${season.premium_cost_coins}🪙` : `${season.elite_cost_gems}💎`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Economy info */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 text-center mb-2 font-semibold">REWARD VALUE COMPARISON</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div>
                  <p className="text-gray-400 font-bold">🆓 Free</p>
                  <p className="text-gray-500">XP + coins</p>
                  <p className="text-green-600">Free forever</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-bold">💎 Premium</p>
                  <p className="text-gray-500">~₹65 value</p>
                  <p className="text-yellow-600">{season.premium_cost_coins} coins</p>
                </div>
                <div>
                  <p className="text-purple-400 font-bold">⚔️ Warrior</p>
                  <p className="text-gray-500">~₹130+ value</p>
                  <p className="text-purple-600">{season.elite_cost_gems} gems</p>
                </div>
              </div>
            </div>

            {/* Tier Navigation */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                className="p-2 bg-discord-dark border border-gray-700 rounded-lg disabled:opacity-30 text-white">
                <FaChevronLeft size={12} />
              </button>
              <span className="text-white font-bold text-sm">
                Tiers {page*tiersPerPage+1}–{Math.min((page+1)*tiersPerPage, season.max_tiers)} of {season.max_tiers}
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
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        reached ? 'bg-green-900 border-green-500 text-green-300' :
                        isCurr ? 'bg-yellow-900 border-yellow-500 text-yellow-300' :
                        'bg-gray-800 border-gray-600 text-gray-500'
                      }`}>{reached ? '✓' : tier}</div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${reached?'text-green-400':isCurr?'text-yellow-400':'text-gray-500'}`}>
                          Tier {tier}
                          {isCurr && <span className="ml-1 text-yellow-500">← Current</span>}
                        </p>
                        <p className="text-xs text-gray-600">{tier * 100} Season XP</p>
                      </div>
                    </div>

                    {/* Reward columns */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['free','premium','warrior']).map(pt => {
                        const rw = getReward(tier, pt);
                        const claimed = isClaimed(tier, pt);
                        const claimable = canClaim(tier, pt);
                        const access = hasPass(pt);
                        const p = PASS[pt];
                        const key = `${pt}_${tier}`;
                        return (
                          <div key={pt} className={`rounded-lg p-2 text-center border ${
                            claimed ? 'bg-green-900 bg-opacity-20 border-green-800' :
                            claimable ? `${p.bg} bg-opacity-30 ${p.border}` :
                            `bg-discord-darkest ${access ? p.border+' border-opacity-30' : 'border-gray-800'}`
                          }`}>
                            {rw ? (
                              <>
                                <div className="text-lg mb-0.5">{rw.icon || REWARD_ICON[rw.reward_type] || '🎁'}</div>
                                <p className={`text-xs font-bold truncate ${p.color}`}>{rw.reward_label}</p>
                                {!access ? (
                                  <div className="flex items-center justify-center gap-0.5 mt-1">
                                    <FaLock size={8} className="text-gray-600" />
                                    <span className="text-xs text-gray-600">{pt==='premium'?'Prem':'War'}</span>
                                  </div>
                                ) : claimed ? (
                                  <div className="flex items-center justify-center gap-0.5 mt-1">
                                    <FaCheckCircle size={9} className="text-green-400" />
                                    <span className="text-xs text-green-400">Done</span>
                                  </div>
                                ) : claimable ? (
                                  <button onClick={() => handleClaim(tier, pt)} disabled={claiming===key}
                                    className={`mt-1 text-xs px-1.5 py-0.5 rounded font-bold w-full ${p.btnClass||'bg-green-600 hover:bg-green-500'} text-white`}>
                                    {claiming===key ? '...' : 'Claim'}
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-center gap-0.5 mt-1">
                                    <FaLock size={8} className="text-gray-600" />
                                    <span className="text-xs text-gray-600">Locked</span>
                                  </div>
                                )}
                              </>
                            ) : <p className="text-xs text-gray-700">—</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── DAILY LOGIN VIEW ─── */}
        {activeView === 'login' && (
          <div className="space-y-4">
            {/* Streak Card */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 border border-blue-600 rounded-xl p-4 text-center">
              <FaCalendarAlt className="text-3xl text-blue-400 mx-auto mb-2" />
              <p className="text-white font-bold text-lg">Daily Login Streak</p>
              <div className="text-5xl font-bold text-yellow-400 my-2">
                {loginStreak} <span className="text-2xl">🔥</span>
              </div>
              <p className="text-blue-300 text-sm mb-3">
                {todayLogin ? 'Streak claimed today! Come back tomorrow.' : 'Claim your daily streak reward!'}
              </p>
              <button onClick={handleDailyLogin} disabled={loginClaiming || !!todayLogin}
                className={`px-6 py-2 rounded-xl font-bold text-white transition-all ${
                  todayLogin ? 'bg-gray-700 cursor-not-allowed' :
                  'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                }`}>
                {loginClaiming ? 'Claiming...' : todayLogin ? '✓ Claimed Today' : '🎁 Claim Daily Reward'}
              </button>
            </div>

            {/* Streak milestone rewards */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <p className="text-white font-bold mb-3 text-sm">🏆 Streak Milestones</p>
              <div className="space-y-2">
                {STREAK_MILESTONES.map(day => {
                  const reward = STREAK_REWARDS[day];
                  const achieved = loginStreak >= day;
                  return (
                    <div key={day} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      achieved ? 'bg-green-900 bg-opacity-20 border-green-700' :
                      loginStreak === day - 1 ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' :
                      'bg-discord-darkest border-gray-800'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 flex-shrink-0 ${
                        achieved ? 'bg-green-900 border-green-500 text-green-300' :
                        'bg-gray-800 border-gray-600 text-gray-500'
                      }`}>
                        {achieved ? '✓' : `${day}d`}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold">{reward.desc}</p>
                        <p className="text-gray-400 text-xs">{reward.icon} {reward.label}</p>
                      </div>
                      {achieved && <FaCheckCircle className="text-green-400 flex-shrink-0" size={14} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily reward scale */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <p className="text-white font-bold mb-3 text-sm">📈 Daily Reward Scale</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label:'Day 1–2',   reward:'30–36 coins' },
                  { label:'Day 3',     reward:'56 coins + 5 gems' },
                  { label:'Day 4–6',   reward:'42–54 coins' },
                  { label:'Day 7',     reward:'500 coins 🎉' },
                  { label:'Day 14',    reward:'₹20 Voucher 🎫' },
                  { label:'Day 30',    reward:'₹30 Voucher 🎫' },
                  { label:'Day 60',    reward:'30 Gems 💎' },
                  { label:'Day 90',    reward:'₹50 Voucher 🎟️' },
                ].map(({ label, reward }) => (
                  <div key={label} className="bg-discord-darkest rounded-lg p-2 border border-gray-800">
                    <p className="text-gray-400 font-semibold">{label}</p>
                    <p className="text-white">{reward}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-2">
                <p className="text-blue-300 text-xs text-center">
                  Every daily login also earns <strong>+25 Season XP</strong> (more on longer streaks)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── MISSIONS VIEW ─── */}
        {activeView === 'missions' && (
          <div className="space-y-3">
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 text-center">
              <FaBolt className="text-3xl text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-bold">Daily Missions</p>
              <p className="text-discord-text text-sm mt-1">Coming in the next update!</p>
              <p className="text-xs text-gray-600 mt-2">Will include: tournament missions, XP missions, win missions and more</p>
            </div>

            {/* How to earn Season XP */}
            <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                <FaBolt className="text-yellow-400" size={14} /> How to Earn Season XP
              </h3>
              <div className="space-y-2">
                {[
                  { icon:'🎮', label:'Join Tournament', xp:'+20–50 XP' },
                  { icon:'🏆', label:'Win Tournament',  xp:'+100–200 XP' },
                  { icon:'🎯', label:'Claim Achievement',xp:'+25–75 XP' },
                  { icon:'📅', label:'Daily Login',      xp:'+25 XP (+more on streak)' },
                ].map(({ icon, label, xp }) => (
                  <div key={label} className="flex items-center justify-between bg-discord-darkest rounded-lg p-2.5 border border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <span className="text-white text-sm font-semibold">{label}</span>
                    </div>
                    <span className="text-yellow-400 text-xs font-bold">{xp}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-discord-darkest rounded-lg p-2 border border-gray-800">
                <p className="text-xs text-discord-text text-center">
                  Every <strong className="text-white">100 Season XP</strong> = 1 tier advance · <strong className="text-white">90 tiers</strong> total
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
