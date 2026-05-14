'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  FaFire, FaStar, FaGem, FaCoins, FaCrown, FaLock,
  FaCheckCircle, FaShieldAlt, FaTicketAlt, FaBolt,
  FaChevronLeft, FaChevronRight, FaClock
} from 'react-icons/fa';

// Manual UTC+5:30 IST conversion
const toIST = (utcString) => {
  if (!utcString) return '';
  try {
    const d = new Date(new Date(utcString).getTime() + (5 * 60 + 30) * 60 * 1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2,'0');
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'} IST`;
  } catch { return ''; }
};

const getRewardIcon = (type) => {
  const icons = { coins:'🪙', gems:'💎', xp:'⭐', voucher_20:'🎫', voucher_30:'🎫', voucher_50:'🎟️', badge:'👑', ticket:'🎮' };
  return icons[type] || '🎁';
};

const PASS_INFO = {
  free:     { label:'Free Pass',     color:'text-gray-300',   bg:'bg-gray-800',   border:'border-gray-600',   badge:'bg-gray-700',   icon:'🆓', glow:'' },
  premium:  { label:'Premium Pass',  color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-600', badge:'bg-yellow-700', icon:'💎', glow:'shadow-yellow-900/50' },
  warrior:  { label:'Warrior Pass',  color:'text-purple-400', bg:'bg-purple-900', border:'border-purple-500', badge:'bg-purple-700', icon:'⚔️', glow:'shadow-purple-900/50' },
};

const getTimeLeft = (endDate) => {
  if (!endDate) return '';
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h left`;
  return `${h}h left`;
};

export default function SeasonPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [season, setSeason] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [userSeason, setUserSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [visibleTier, setVisibleTier] = useState(1);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadSeason = useCallback(async () => {
    try {
      // Get active season
      const { data: seasonData } = await supabase
        .from('seasons').select('*').eq('is_active', true).single();
      if (!seasonData) { setLoading(false); return; }
      setSeason(seasonData);

      // Get all rewards for this season
      const { data: rewardsData } = await supabase
        .from('season_rewards').select('*')
        .eq('season_id', seasonData.id)
        .order('tier').order('pass_type');
      setRewards(rewardsData || []);

      // Get user's season data
      if (user) {
        const { data: userSeasonData } = await supabase
          .from('user_seasons').select('*')
          .eq('user_id', user.id).eq('season_id', seasonData.id).single();

        if (userSeasonData) {
          setUserSeason(userSeasonData);
          setVisibleTier(Math.max(1, userSeasonData.current_tier));
        } else {
          // Auto-enroll in free pass
          await supabase.rpc('enroll_season', { p_user_id: user.id, p_season_id: seasonData.id });
          setUserSeason({ pass_type: 'free', current_tier: 0, season_xp: 0, claimed_tiers: [] });
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadSeason(); }, [loadSeason]);

  const handleClaim = async (tier, passType) => {
    if (!user || !season) return;
    const key = `${passType}_${tier}`;
    setClaiming(key);
    try {
      const { data, error } = await supabase.rpc('claim_season_reward', {
        p_user_id: user.id,
        p_season_id: season.id,
        p_tier: tier,
        p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showMessage(`✅ Claimed: ${data.reward}`);
      await loadSeason();
      await refreshProfile();
    } catch (e) {
      showMessage(`❌ ${e.message}`, 'error');
    } finally { setClaiming(null); }
  };

  const handleUpgrade = async (passType) => {
    if (!user || !season) return;
    const cost = passType === 'premium'
      ? `${season.premium_cost_coins} coins`
      : `${season.elite_cost_gems} gems`;
    if (!confirm(`Upgrade to ${PASS_INFO[passType].label}?\n\nCost: ${cost}`)) return;

    setUpgrading(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_season_pass', {
        p_user_id: user.id,
        p_season_id: season.id,
        p_pass_type: passType
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      showMessage(`✅ Upgraded to ${PASS_INFO[passType].label}!`);
      await loadSeason();
      await refreshProfile();
    } catch (e) {
      showMessage(`❌ ${e.message}`, 'error');
    } finally { setUpgrading(false); }
  };

  const isClaimed = (tier, passType) => {
    if (!userSeason?.claimed_tiers) return false;
    return userSeason.claimed_tiers.includes(`${passType}_${tier}`);
  };

  const canClaim = (tier, passType) => {
    if (!userSeason) return false;
    if (isClaimed(tier, passType)) return false;
    if (userSeason.current_tier < tier) return false;
    if (passType === 'premium' && !['premium','warrior'].includes(userSeason.pass_type)) return false;
    if (passType === 'warrior' && userSeason.pass_type !== 'warrior') return false;
    return true;
  };

  const hasPassAccess = (passType) => {
    if (!userSeason) return passType === 'free';
    if (passType === 'free') return true;
    if (passType === 'premium') return ['premium','warrior'].includes(userSeason.pass_type);
    if (passType === 'warrior') return userSeason.pass_type === 'warrior';
    return false;
  };

  const getRewardForTier = (tier, passType) =>
    rewards.find(r => r.tier === tier && r.pass_type === passType);

  const xpProgress = userSeason ? (userSeason.season_xp % 100) : 0;
  const currentTier = userSeason?.current_tier || 0;

  if (loading) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  if (!season) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
      <div className="text-center">
        <FaFire className="text-5xl text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Active Season</h2>
        <p className="text-discord-text">Check back soon for the next season!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-darkest p-3 md:p-6">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${message.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {message.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Season Banner */}
        <div className="bg-gradient-to-br from-red-900 to-orange-900 border border-red-600 rounded-xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none">🔥</div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaFire className="text-orange-400" />
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Active Season</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{season.name}</h1>
              <p className="text-orange-200 text-sm mt-1">{season.description}</p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 mb-4">
            <FaClock className="text-orange-400 text-sm" />
            <span className="text-orange-300 text-sm font-bold">{getTimeLeft(season.end_date)}</span>
            <span className="text-orange-500 text-xs">· Ends {toIST(season.end_date)}</span>
          </div>

          {/* XP Progress */}
          {userSeason && (
            <div>
              <div className="flex justify-between text-xs text-orange-300 mb-1">
                <span>Tier {currentTier}/{season.max_tiers}</span>
                <span>{userSeason.season_xp} Season XP · {xpProgress}/100 to next tier</span>
              </div>
              <div className="w-full bg-red-950 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pass Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(['free','premium','warrior']).map(passType => {
            const info = PASS_INFO[passType];
            const owned = hasPassAccess(passType);
            return (
              <div key={passType} className={`rounded-xl border p-3 text-center ${owned ? `${info.bg} bg-opacity-30 ${info.border}` : 'bg-discord-dark border-gray-700'}`}>
                <div className="text-2xl mb-1">{info.icon}</div>
                <p className={`font-bold text-xs ${owned ? info.color : 'text-gray-500'}`}>{info.label}</p>
                {owned ? (
                  <span className="text-xs text-green-400 font-bold">✓ Owned</span>
                ) : (
                  <button
                    onClick={() => handleUpgrade(passType)}
                    disabled={upgrading || passType === 'free'}
                    className={`mt-1 text-xs px-2 py-1 rounded font-bold w-full transition-all ${
                      passType === 'premium' ? 'bg-yellow-600 hover:bg-yellow-500 text-white' :
                      passType === 'warrior' ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                      'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {passType === 'premium' ? `${season.premium_cost_coins}🪙` :
                     passType === 'warrior' ? `${season.elite_cost_gems}💎` : 'Free'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pass Info Legend */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <p className="text-gray-400 font-bold mb-1">🆓 Free Pass</p>
              <p className="text-gray-500">XP + small coins</p>
              <p className="text-gray-500">Free for everyone</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold mb-1">💎 Premium Pass</p>
              <p className="text-gray-500">Gems + big coins</p>
              <p className="text-yellow-600">{season.premium_cost_coins} coins</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold mb-1">⚔️ Warrior Pass</p>
              <p className="text-gray-500">Best rewards</p>
              <p className="text-purple-600">{season.elite_cost_gems} gems</p>
            </div>
          </div>
        </div>

        {/* Tier Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setVisibleTier(v => Math.max(1, v - 5))} disabled={visibleTier <= 1}
            className="p-2 bg-discord-dark border border-gray-700 rounded-lg disabled:opacity-30 text-white">
            <FaChevronLeft />
          </button>
          <span className="text-white font-bold text-sm">Tiers {visibleTier}–{Math.min(visibleTier + 4, season.max_tiers)}</span>
          <button onClick={() => setVisibleTier(v => Math.min(season.max_tiers - 4, v + 5))} disabled={visibleTier >= season.max_tiers - 4}
            className="p-2 bg-discord-dark border border-gray-700 rounded-lg disabled:opacity-30 text-white">
            <FaChevronRight />
          </button>
        </div>

        {/* Tier Rewards */}
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => visibleTier + i).filter(t => t <= season.max_tiers).map(tier => {
            const isReached = currentTier >= tier;
            const isCurrent = currentTier === tier - 1;

            return (
              <div key={tier} className={`bg-discord-dark border rounded-xl p-4 transition-all ${
                isCurrent ? 'border-yellow-500 ring-1 ring-yellow-500' :
                isReached ? 'border-green-800' : 'border-gray-800'
              }`}>
                {/* Tier Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                    isReached ? 'bg-green-900 border-green-500 text-green-300' :
                    isCurrent ? 'bg-yellow-900 border-yellow-500 text-yellow-300' :
                    'bg-gray-800 border-gray-600 text-gray-500'
                  }`}>
                    {isReached ? '✓' : tier}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${isReached ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-gray-400'}`}>
                      Tier {tier}
                      {isCurrent && <span className="ml-2 text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">← Current</span>}
                    </p>
                    <p className="text-xs text-gray-600">Requires {tier * 100} Season XP</p>
                  </div>
                </div>

                {/* Rewards Row */}
                <div className="grid grid-cols-3 gap-2">
                  {(['free','premium','warrior']).map(passType => {
                    const reward = getRewardForTier(tier, passType);
                    const claimed = isClaimed(tier, passType);
                    const claimable = canClaim(tier, passType);
                    const hasAccess = hasPassAccess(passType);
                    const info = PASS_INFO[passType];
                    const claimKey = `${passType}_${tier}`;

                    return (
                      <div key={passType} className={`rounded-lg p-2 text-center border transition-all ${
                        claimed ? 'bg-green-900 bg-opacity-20 border-green-700' :
                        claimable ? `${info.bg} bg-opacity-30 ${info.border}` :
                        hasAccess && isReached ? `${info.bg} bg-opacity-10 ${info.border} border-opacity-30` :
                        'bg-discord-darkest border-gray-800'
                      }`}>
                        {reward ? (
                          <>
                            <div className="text-xl mb-1">{reward.icon || getRewardIcon(reward.reward_type)}</div>
                            <p className={`text-xs font-bold truncate ${info.color}`}>{reward.reward_label}</p>
                            {!hasAccess ? (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <FaLock className="text-gray-600 text-xs" />
                                <span className="text-xs text-gray-600">{info.label}</span>
                              </div>
                            ) : claimed ? (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <FaCheckCircle className="text-green-400 text-xs" />
                                <span className="text-xs text-green-400">Claimed</span>
                              </div>
                            ) : claimable ? (
                              <button
                                onClick={() => handleClaim(tier, passType)}
                                disabled={claiming === claimKey}
                                className={`mt-1 text-xs px-2 py-1 rounded font-bold w-full ${
                                  passType === 'warrior' ? 'bg-purple-600 hover:bg-purple-500' :
                                  passType === 'premium' ? 'bg-yellow-600 hover:bg-yellow-500' :
                                  'bg-green-600 hover:bg-green-500'
                                } text-white transition-all`}
                              >
                                {claiming === claimKey ? '...' : 'Claim'}
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <FaLock className="text-gray-600 text-xs" />
                                <span className="text-xs text-gray-600">Locked</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-600">—</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* How to earn Season XP */}
        <div className="mt-6 bg-discord-dark border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <FaBolt className="text-yellow-400" /> How to earn Season XP
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎮</span>
              <div>
                <p className="text-white font-semibold">Join Tournament</p>
                <p className="text-discord-text text-xs">+20–50 Season XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-white font-semibold">Win Tournament</p>
                <p className="text-discord-text text-xs">+100–200 Season XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-white font-semibold">Claim Achievement</p>
                <p className="text-discord-text text-xs">+25–75 Season XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-white font-semibold">Daily Login</p>
                <p className="text-discord-text text-xs">Coming soon</p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-discord-darkest rounded-lg p-3">
            <p className="text-xs text-discord-text text-center">
              Every <strong className="text-white">100 Season XP</strong> = 1 tier advance · Max <strong className="text-white">{season.max_tiers} tiers</strong> this season
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
