'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaTrophy, FaCrown, FaSkull, FaMoneyBillWave, FaLock, FaCheckCircle, FaStar } from 'react-icons/fa';

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
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('requirement_value', { ascending: true });

      setAchievements(achievementsData || []);

      // Load user's unlocked achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id);

      setUserAchievements(userAchievementsData || []);

      // Load user stats from database
      const { data: userData } = await supabase
        .from('users')
        .select('achievement_points')
        .eq('id', user.id)
        .single();

      // Calculate user's current progress
      const { data: participantsData } = await supabase
        .from('tournament_participants')
        .select('got_booyah, kills, prize_won')
        .eq('user_id', user.id);

      const stats = {
        tournament_joins: participantsData?.length || 0,
        tournament_wins: participantsData?.filter(p => p.got_booyah).length || 0,
        total_kills: participantsData?.reduce((sum, p) => sum + (p.kills || 0), 0) || 0,
        total_earnings: participantsData?.reduce((sum, p) => sum + (parseFloat(p.prize_won) || 0), 0) || 0,
        achievement_points: userData?.achievement_points || 0
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error loading achievements:', error);
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
      case 'tournament_join':
        current = userStats.tournament_joins;
        break;
      case 'tournament_win':
        current = userStats.tournament_wins;
        break;
      case 'total_kills':
        current = userStats.total_kills;
        break;
      case 'total_earnings':
        current = userStats.total_earnings;
        break;
      default:
        current = 0;
    }

    const progress = Math.min(100, (current / achievement.requirement_value) * 100);
    return { current, progress };
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'tournament': return <FaTrophy className="text-blue-400" />;
      case 'victory': return <FaCrown className="text-yellow-400" />;
      case 'combat': return <FaSkull className="text-red-400" />;
      case 'wealth': return <FaMoneyBillWave className="text-green-400" />;
      default: return <FaStar className="text-purple-400" />;
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
        <div className="text-center">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-discord-text">Please login to view your achievements</p>
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-discord-text">Track your progress and unlock rewards</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaTrophy className="text-3xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Achievement Points</p>
            <p className="text-2xl font-bold text-white">{userStats.achievement_points}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaStar className="text-3xl text-yellow-400 mb-2" />
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
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaSkull className="text-3xl text-red-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Kills</p>
            <p className="text-2xl font-bold text-white">{userStats.total_kills}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Overall Progress</h3>
            <span className="text-sm font-bold text-purple-400">{completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'unlocked', 'locked', 'tournament', 'victory', 'combat', 'wealth'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-discord-dark text-discord-text hover:bg-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-white mb-2">No achievements found</p>
              <p className="text-discord-text">Try a different filter</p>
            </div>
          ) : (
            filteredAchievements.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              const { current, progress } = getProgress(achievement);

              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-6 border-2 transition-all ${
                    unlocked
                      ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500'
                      : 'bg-discord-dark border-gray-800 opacity-75'
                  }`}
                >
                  {/* Unlocked Badge */}
                  {unlocked && (
                    <div className="absolute top-4 right-4">
                      <FaCheckCircle className="text-2xl text-green-400" />
                    </div>
                  )}

                  {/* Locked Icon */}
                  {!unlocked && (
                    <div className="absolute top-4 right-4">
                      <FaLock className="text-2xl text-gray-600" />
                    </div>
                  )}

                  {/* Category Icon */}
                  <div className="text-4xl mb-4">
                    {getCategoryIcon(achievement.category)}
                  </div>

                  {/* Achievement Name */}
                  <h3 className={`text-xl font-bold mb-2 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
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

                  {/* Progress Bar (only for locked achievements) */}
                  {!unlocked && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-bold text-gray-400">
                          {current}/{achievement.requirement_value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Unlocked Date */}
                  {unlocked && (
                    <div className="mt-4 pt-4 border-t border-purple-700">
                      <p className="text-xs text-purple-300">
                        Unlocked: {new Date(
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
