'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaTrophy, FaCrown, FaSkull, FaMoneyBillWave, FaLock, FaCheckCircle, FaStar, FaFire } from 'react-icons/fa';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userStats, setUserStats] = useState({
    tournament_joins: 0,
    tournament_wins: 0,
    total_kills: 0,
    total_earnings: 0,
    achievement_points: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load all achievements
      const { data: achievementsData, error: achErr } = await supabase
        .from('achievements')
        .select('*')
        .order('category')
        .order('requirement_value');

      if (achErr) console.error('Achievements error:', achErr);
      setAchievements(achievementsData || []);

      // Load user's unlocked achievements
      const { data: userAchData, error: uaErr } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (uaErr) console.error('User achievements error:', uaErr);
      setUserAchievements(userAchData || []);

      // Load user data
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('achievement_points, total_wins, total_games')
        .eq('id', user.id)
        .single();

      if (userErr) console.error('User data error:', userErr);

      // Load participant stats
      const { data: participantData, error: partErr } = await supabase
        .from('tournament_participants')
        .select('got_booyah, kills, prize_won')
        .eq('user_id', user.id);

      if (partErr) console.error('Participant error:', partErr);

      const stats = {
        tournament_joins: participantData?.length || 0,
        tournament_wins: participantData?.filter(p => p.got_booyah === true).length || 0,
        total_kills: participantData?.reduce((sum, p) => sum + (parseInt(p.kills) || 0), 0) || 0,
        total_earnings: Math.floor(participantData?.reduce((sum, p) => sum + (parseFloat(p.prize_won) || 0), 0) || 0),
        achievement_points: userData?.achievement_points || 0
      };

      console.log('User stats:', stats);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement) => {
    let current = 0;
    
    switch (achievement.requirement_type) {
      case 'tournament_join': current = userStats.tournament_joins; break;
      case 'tournament_win': current = userStats.tournament_wins; break;
      case 'total_kills': current = userStats.total_kills; break;
      case 'total_earnings': current = userStats.total_earnings; break;
    }

    const progress = Math.min(100, (current / achievement.requirement_value) * 100);
    return { current, progress };
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
      case 'tournament': return 'text-blue-400';
      case 'victory': return 'text-yellow-400';
      case 'combat': return 'text-red-400';
      case 'wealth': return 'text-green-400';
      default: return 'text-purple-400';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return isUnlocked(achievement.id);
    if (filter === 'locked') return !isUnlocked(achievement.id);
    if (filter === 'all') return true;
    return achievement.category === filter;
  });

  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-discord-text">Please login to view achievements</p>
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
    <div className="min-h-screen bg-discord-darkest p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FaTrophy className="text-4xl text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Achievements</h1>
          </div>
          <p className="text-discord-text">Unlock achievements and earn points</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-4">
            <FaStar className="text-3xl text-yellow-400 mb-2" />
            <p className="text-xs text-purple-200 mb-1">Points</p>
            <p className="text-2xl font-bold text-white">{userStats.achievement_points}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaCheckCircle className="text-3xl text-green-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Unlocked</p>
            <p className="text-2xl font-bold text-white">{unlockedCount}/{totalCount}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaTrophy className="text-3xl text-blue-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Tournaments</p>
            <p className="text-2xl font-bold text-white">{userStats.tournament_joins}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaCrown className="text-3xl text-yellow-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Wins</p>
            <p className="text-2xl font-bold text-white">{userStats.tournament_wins}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 col-span-2 md:col-span-1">
            <FaSkull className="text-3xl text-red-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Kills</p>
            <p className="text-2xl font-bold text-white">{userStats.total_kills}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Overall Progress</h3>
            <span className="text-sm font-bold text-purple-400">{completionPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'unlocked', 'locked', 'tournament', 'victory', 'combat', 'wealth'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-discord-dark text-discord-text hover:bg-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const { current, progress } = getProgress(achievement);
            const Icon = getCategoryIcon(achievement.category);
            const colorClass = getCategoryColor(achievement.category);

            return (
              <div
                key={achievement.id}
                className={`relative rounded-xl p-6 border-2 transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-discord-dark border-gray-800'
                }`}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  {unlocked ? (
                    <FaCheckCircle className="text-2xl text-green-400" />
                  ) : (
                    <FaLock className="text-2xl text-gray-600" />
                  )}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <Icon className={`text-4xl ${unlocked ? colorClass : 'text-gray-600'}`} />
                </div>

                {/* Name */}
                <h3 className={`text-xl font-bold mb-2 pr-8 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                  {achievement.name}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-4 ${unlocked ? 'text-purple-200' : 'text-gray-500'}`}>
                  {achievement.description}
                </p>

                {/* Points */}
                <div className="flex items-center gap-2 mb-4">
                  <FaStar className={unlocked ? 'text-yellow-400' : 'text-gray-600'} />
                  <span className={`font-bold ${unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {achievement.points} points
                  </span>
                </div>

                {/* Progress (locked only) */}
                {!unlocked && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className="text-xs font-bold text-gray-400">
                        {current}/{achievement.requirement_value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Unlocked date */}
                {unlocked && (
                  <div className="mt-4 pt-4 border-t border-purple-700">
                    <p className="text-xs text-purple-300 flex items-center gap-2">
                      <FaFire className="text-yellow-400" />
                      Unlocked {new Date(
                        userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at
                      ).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
