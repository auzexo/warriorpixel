'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaTrophy, FaCrown, FaSkull, FaMoneyBillWave, FaLock, FaCheckCircle, FaStar, FaCoins, FaGift, FaSync } from 'react-icons/fa';

export default function AchievementsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAchievements();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase.rpc('check_unlockable_achievements', {
        p_user_id: user.id
      });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      alert('Error loading achievements. Please refresh the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
  };

  const handleClaim = async (achievementId, achievementName) => {
    setClaiming(achievementId);
    
    try {
      const { data, error } = await supabase.rpc('claim_achievement', {
        p_user_id: user.id,
        p_achievement_id: achievementId
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.success) {
        alert(`🎉 Achievement Claimed!\n\n${achievementName}\n\n+${result.points_earned} Points\n+${result.coins_earned} Coins`);
        await loadAchievements();
        await refreshProfile();
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('Claim error:', error);
      alert('Error claiming achievement: ' + error.message);
    } finally {
      setClaiming(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'tournament': return FaTrophy;
      case 'victory': return FaCrown;
      case 'combat': return FaSkull;
      case 'wealth': return FaMoneyBillWave;
      default: return FaStar;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tournament': return 'blue';
      case 'victory': return 'yellow';
      case 'combat': return 'red';
      case 'wealth': return 'green';
      default: return 'purple';
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'claimable') return a.is_unlocked && !a.is_claimed;
    if (filter === 'claimed') return a.is_claimed;
    if (filter === 'locked') return !a.is_unlocked;
    return filter === 'all';
  });

  const claimableCount = achievements.filter(a => a.is_unlocked && !a.is_claimed).length;
  const claimedCount = achievements.filter(a => a.is_claimed).length;
  const totalPoints = achievements.filter(a => a.is_claimed).reduce((sum, a) => sum + a.points, 0);
  

  const currentStats = {
    tournaments: achievements.find(a => a.requirement_type === 'tournament_join')?.current_progress || 0,
    wins: achievements.find(a => a.requirement_type === 'tournament_win')?.current_progress || 0,
    kills: achievements.find(a => a.requirement_type === 'total_kills')?.current_progress || 0,
    earnings: achievements.find(a => a.requirement_type === 'total_earnings')?.current_progress || 0
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
        <div className="text-center">
          <FaTrophy className="text-5xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-sm text-discord-text">Login to view achievements</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaTrophy className="text-2xl md:text-3xl text-purple-400" />
              <h1 className="text-xl md:text-3xl font-bold text-white">Achievements</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-all text-sm"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
          <p className="text-xs md:text-sm text-discord-text">Complete achievements to earn coins and points</p>
        </div>

        {/* Current Stats */}
        <div className="bg-discord-dark border border-gray-800 rounded-lg p-3 md:p-4 mb-4">
          <h3 className="text-sm font-bold text-white mb-3">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <FaTrophy className="text-xl md:text-2xl text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-discord-text">Tournaments</p>
              <p className="text-lg md:text-xl font-bold text-white">{currentStats.tournaments}</p>
            </div>
            <div className="text-center">
              <FaCrown className="text-xl md:text-2xl text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-discord-text">Wins</p>
              <p className="text-lg md:text-xl font-bold text-white">{currentStats.wins}</p>
            </div>
            <div className="text-center">
              <FaSkull className="text-xl md:text-2xl text-red-400 mx-auto mb-1" />
              <p className="text-xs text-discord-text">Kills</p>
              <p className="text-lg md:text-xl font-bold text-white">{currentStats.kills}</p>
            </div>
            <div className="text-center">
              <FaMoneyBillWave className="text-xl md:text-2xl text-green-400 mx-auto mb-1" />
              <p className="text-xs text-discord-text">Earnings</p>
              <p className="text-lg md:text-xl font-bold text-white">₹{currentStats.earnings}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-lg p-3">
            <FaStar className="text-xl md:text-2xl text-yellow-400 mb-1" />
            <p className="text-xs text-purple-200">Points</p>
            <p className="text-lg md:text-xl font-bold text-white">{totalPoints}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-600 rounded-lg p-3">
            <FaCoins className="text-xl md:text-2xl text-yellow-400 mb-1" />
            <p className="text-xs text-yellow-200">Coins</p>
            <p className="text-lg md:text-xl font-bold text-white">{parseInt(profile?.wallet_coins || 0)}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-3">
            <FaGift className="text-xl md:text-2xl text-blue-400 mb-1" />
            <p className="text-xs text-discord-text">Claimable</p>
            <p className="text-lg md:text-xl font-bold text-white">{claimableCount}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-3">
            <FaCheckCircle className="text-xl md:text-2xl text-green-400 mb-1" />
            <p className="text-xs text-discord-text">Claimed</p>
            <p className="text-lg md:text-xl font-bold text-white">{claimedCount}/{achievements.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['all', 'claimable', 'claimed', 'locked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg font-semibold capitalize whitespace-nowrap text-sm transition-all ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-discord-dark text-discord-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaTrophy className="text-5xl text-gray-600 mx-auto mb-4" />
              <p className="text-white mb-2">No {filter} achievements</p>
              <p className="text-sm text-discord-text">Try a different filter</p>
            </div>
          ) : (
            filteredAchievements.map(achievement => {
              const Icon = getCategoryIcon(achievement.requirement_type?.split('_')[1] || 'general');
              const color = getCategoryColor(achievement.requirement_type?.split('_')[1] || 'general');
              const progress = (achievement.current_progress / achievement.requirement_value) * 100;
              const canClaim = achievement.is_unlocked && !achievement.is_claimed;

              return (
                <div
                  key={achievement.achievement_id}
                  className={`relative rounded-lg p-4 border-2 ${
                    achievement.is_claimed 
                      ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-600'
                      : canClaim
                      ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500'
                      : 'bg-discord-dark border-gray-800'
                  }`}
                >
                  {/* Icon & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`text-2xl md:text-3xl text-${color}-400`} />
                    {achievement.is_claimed ? (
                      <FaCheckCircle className="text-lg md:text-xl text-green-400" />
                    ) : canClaim ? (
                      <FaGift className="text-lg md:text-xl text-yellow-400 animate-bounce" />
                    ) : (
                      <FaLock className="text-lg md:text-xl text-gray-600" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`text-base md:text-lg font-bold mb-1 ${
                    achievement.is_claimed ? 'text-white' : canClaim ? 'text-white' : 'text-gray-400'
                  }`}>
                    {achievement.achievement_name}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs mb-3 ${
                    achievement.is_claimed ? 'text-green-200' : canClaim ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {achievement.achievement_description}
                  </p>

                  {/* Rewards - COINS NOT RUPEES */}
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-400 text-sm" />
                      <span className="font-bold text-white">{achievement.points} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCoins className="text-yellow-400 text-sm" />
                      <span className="font-bold text-white">{achievement.coin_reward} coins</span>
                    </div>
                  </div>

                  {/* Progress */}
                  {!achievement.is_claimed && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-bold text-gray-300">
                          {achievement.current_progress}/{achievement.requirement_value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className={`bg-${color}-600 h-full rounded-full transition-all`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Claim Button */}
                  {canClaim && (
                    <button
                      onClick={() => handleClaim(achievement.achievement_id, achievement.achievement_name)}
                      disabled={claiming === achievement.achievement_id}
                      className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      {claiming === achievement.achievement_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Claiming...
                        </>
                      ) : (
                        <>
                          <FaGift />
                          Claim Reward
                        </>
                      )}
                    </button>
                  )}

                  {/* Claimed Badge */}
                  {achievement.is_claimed && (
                    <div className="flex items-center justify-center gap-2 text-green-300 text-sm font-bold">
                      <FaCheckCircle />
                      Claimed
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
