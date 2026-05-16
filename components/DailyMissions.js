'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  FaBolt, FaCheckCircle, FaLock, FaCoins,
  FaGem, FaStar, FaSync, FaClock, FaTrophy
} from 'react-icons/fa';

const DIFF_STYLES = {
  easy:   { label:'Easy',   color:'text-green-400',  bg:'bg-green-900',  border:'border-green-700',  badgeBg:'bg-green-900 border-green-600'  },
  medium: { label:'Medium', color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-700', badgeBg:'bg-yellow-900 border-yellow-600' },
  hard:   { label:'Hard',   color:'text-red-400',    bg:'bg-red-900',    border:'border-red-700',    badgeBg:'bg-red-900 border-red-600'       },
};

const RewardIcon = ({ type, amount }) => {
  if (type === 'coins') return <span className="flex items-center gap-0.5 text-yellow-400 font-bold text-xs"><FaCoins size={10}/>{amount}</span>;
  if (type === 'gems')  return <span className="flex items-center gap-0.5 text-purple-400 font-bold text-xs"><FaGem size={10}/>{amount}</span>;
  if (type === 'xp')    return <span className="flex items-center gap-0.5 text-blue-400 font-bold text-xs"><FaStar size={10}/>{amount} XP</span>;
  return <span className="text-xs text-gray-400">{amount}</span>;
};

// IST date string (YYYY-MM-DD)
const todayIST = () => {
  const d = new Date(Date.now() + 19800000);
  return d.toISOString().split('T')[0];
};

// Time until IST midnight
const timeUntilReset = () => {
  const now = new Date(Date.now() + 19800000); // IST now
  const midnight = new Date(now);
  midnight.setUTCHours(18, 30, 0, 0); // 18:30 UTC = 00:00 IST next day
  if (midnight <= now) midnight.setUTCDate(midnight.getUTCDate() + 1);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export function DailyMissions({ onXPEarned }) {
  const { user, refreshProfile } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [toast, setToast] = useState(null);
  const [resetTimer, setResetTimer] = useState('');

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Assign today's missions if not yet assigned
      await supabase.rpc('assign_daily_missions', { p_user_id: user.id });

      // Fetch today's missions
      const today = todayIST();
      const { data, error } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_date', today)
        .order('difficulty');

      if (error) throw error;
      setMissions(data || []);
    } catch (e) {
      console.error('Mission load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  // Update reset timer every minute
  useEffect(() => {
    setResetTimer(timeUntilReset());
    const interval = setInterval(() => setResetTimer(timeUntilReset()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (missionId) => {
    if (!user) return;
    setClaiming(missionId);
    try {
      const { data, error } = await supabase.rpc('claim_mission_reward', {
        p_user_id: user.id,
        p_mission_id: missionId
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      showToast(`✅ ${data.title}: +${data.reward_amount} ${data.reward_type.replace(/_/g, ' ')} & +${data.season_xp} Season XP`);
      await loadMissions();
      await refreshProfile();
      if (onXPEarned) onXPEarned();
    } catch (e) {
      showToast(`❌ ${e.message}`, 'error');
    } finally {
      setClaiming(null);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;
  const claimedCount = missions.filter(m => m.reward_claimed).length;
  const totalXP = missions.reduce((s, m) => s + (m.reward_claimed ? m.season_xp_reward : 0), 0);

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-2 rounded-xl font-bold text-white text-sm shadow-lg text-center ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-600 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FaBolt className="text-yellow-400" size={16} />
            <p className="text-white font-bold">Daily Missions</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-300">
            <FaClock size={10} />
            <span>Resets in {resetTimer}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 bg-purple-950 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-400 to-purple-400 h-full rounded-full transition-all"
              style={{ width: `${missions.length > 0 ? (claimedCount / missions.length) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-purple-300 flex-shrink-0">
            {claimedCount}/{missions.length} done
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-purple-300">
            {completedCount > claimedCount ? `${completedCount - claimedCount} ready to claim!` : completedCount > 0 ? 'All claimed!' : 'Complete missions to earn rewards'}
          </span>
          <div className="flex items-center gap-1 text-yellow-400">
            <FaStar size={9} />
            <span className="font-bold">+{totalXP} XP earned</span>
          </div>
        </div>
      </div>

      {/* Mission Cards */}
      {missions.length === 0 ? (
        <div className="text-center py-8 bg-discord-dark border border-gray-800 rounded-xl">
          <FaBolt className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-discord-text text-sm">No missions yet. Check back soon!</p>
        </div>
      ) : (
        missions.map(mission => {
          const diff = DIFF_STYLES[mission.difficulty] || DIFF_STYLES.easy;
          const progress = Math.min(100, (mission.current_progress / mission.target_value) * 100);
          const isClaimable = mission.completed && !mission.reward_claimed;
          const isClaiming = claiming === mission.id;

          return (
            <div key={mission.id} className={`bg-discord-dark border rounded-xl p-3 ${
              mission.reward_claimed ? 'border-gray-800 opacity-60' :
              isClaimable ? `${diff.border} shadow-sm` : 'border-gray-800'
            }`}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  mission.reward_claimed ? 'bg-gray-800' :
                  isClaimable ? `${diff.bg} bg-opacity-40` : 'bg-discord-darkest'
                }`}>
                  {mission.reward_claimed ? '✅' : mission.icon || '🎯'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${mission.reward_claimed ? 'text-gray-500' : 'text-white'}`}>
                        {mission.title}
                      </p>
                      {mission.description && (
                        <p className="text-xs text-discord-text mt-0.5">{mission.description}</p>
                      )}
                    </div>
                    {/* Difficulty badge */}
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded border font-bold ${diff.badgeBg} ${diff.color}`}>
                      {diff.label}
                    </span>
                  </div>

                  {/* Progress */}
                  {!mission.reward_claimed && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={mission.completed ? 'text-green-400' : 'text-discord-text'}>
                          {mission.current_progress}/{mission.target_value}
                          {mission.mission_type === 'earn_xp' || mission.mission_type === 'earn_season_xp' ? ' XP' : ''}
                        </span>
                        <span className={mission.completed ? 'text-green-400 font-bold' : 'text-discord-text'}>
                          {mission.completed ? '✓ Complete!' : `${Math.round(progress)}%`}
                        </span>
                      </div>
                      <div className="bg-gray-800 rounded-full h-1.5">
                        <div className={`h-full rounded-full transition-all ${
                          mission.completed ? 'bg-green-500' : `bg-gradient-to-r ${diff.color === 'text-green-400' ? 'from-green-600 to-green-400' : diff.color === 'text-yellow-400' ? 'from-yellow-600 to-yellow-400' : 'from-red-600 to-red-400'}`
                        }`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Rewards row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Rewards:</span>
                      <RewardIcon type={mission.reward_type} amount={mission.reward_amount} />
                      <span className="flex items-center gap-0.5 text-orange-400 text-xs font-bold">
                        <FaStar size={9}/>{mission.season_xp_reward} XP
                      </span>
                    </div>

                    {/* Claim button */}
                    {mission.reward_claimed ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaCheckCircle size={10} className="text-green-600" /> Claimed
                      </span>
                    ) : isClaimable ? (
                      <button onClick={() => handleClaim(mission.id)} disabled={isClaiming}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white transition-all ${
                          diff.color === 'text-green-400' ? 'bg-green-600 hover:bg-green-500' :
                          diff.color === 'text-yellow-400' ? 'bg-yellow-600 hover:bg-yellow-500' :
                          'bg-red-600 hover:bg-red-500'
                        }`}>
                        {isClaiming ? '...' : '🎁 Claim'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <FaLock size={9} /> In progress
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Refresh */}
      <button onClick={loadMissions}
        className="w-full py-2 text-xs text-purple-400 flex items-center justify-center gap-1 hover:text-purple-300">
        <FaSync size={10} /> Refresh missions
      </button>
    </div>
  );
}
