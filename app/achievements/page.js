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
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (achievementsError) {
        console.error('Achievements error:', achievementsError);
      } else {
        setAchievements(achievementsData || []);
      }

      // Load user's unlocked achievements
      const { data: userAchievementsData, error: userAchError } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id);

      if (userAchError) {
        console.error('User achievements error:', userAchError);
      } else {
        setUserAchievements(userAchievementsData || []);
      }

      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('achievement_points, total_wins, total_games')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User data error:', userError);
      }

      // Load participant data
      const { data: participantsData, error: partError } = await supabase
        .from('tournament_participants')
        .select('got_booyah, kills, prize_won')
        .eq('user_id', user.id);

      if (partError) {
        console.error('Participants error:', partError);
      }

      console.log('Participants data:', participantsData);

      const stats = {
        tournament_joins: participantsData?.length || 0,
        tournament_wins: participantsData?.filter(p => p.got_booyah === true).length || 0,
        total_kills: participantsData?.reduce((sum, p) => sum + (parseInt(p.kills) || 0), 0) || 0,
        total_earnings: Math.floor(participantsData?.reduce((sum, p) => sum + (parseFloat(p.prize_won) || 0), 0) || 0),
        achievement_points: userData?.achievement_points || 0
      };

      console.log('Calculated stats:', stats);
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
      case 'tournament': return <FaTrophy className="text-2xl md:text-3xl text-blue-400" />;
      case 'victory': return <FaCrown className="text-2xl md:text-3xl text-yellow-400" />;
      case 'combat': return <FaSkull className="text-2xl md:text-3xl text-red-400" />;
      case 'wealth': return <FaMoneyBillWave className="text-2xl md:text-3xl text-green-400" />;
      default: return <FaStar className="text-2xl md:text-3xl text-purple-400" />;
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
          <FaTrophy className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-sm md:text-base text-discord-text">Please login to view your achievements</p>
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
    <div className="min-h-screen bg-discord-darkest p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-sm md:text-base text-discord-text">Track your progress and unlock rewards</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 md:p-4">
            <FaTrophy className="text-2xl md:text-3xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text mb-1 truncate">Points</p>
            <p className="text-xl md:text-2xl font-bold text-white">{userStats.achievement_points}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 md:p-4">
            <FaStar className="text-2xl md:text-3xl text-yellow-400 mb-2" />
            <p className="text-xs text-discord-text mb-1 truncate">Unlocked</p>
            <p className="text-xl md:text-2xl font-bold text-white">{unlockedCount}/{totalCount}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 md:p-4">
            <FaTrophy className="text-2xl md:text-3xl text-blue-400 mb-2" />
            <p className="text-xs text-discord-text mb-1 truncate">Tournaments</p>
            <p className="text-xl md:text-2xl font-bold text-white">{userStats.tournament_joins}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 md:p-4">
            <FaCrown className="text-2xl md:text-3xl text-yellow-400 mb-2" />
            <p className="text-xs text-discord-text mb-1 truncate">Wins</p>
            <p className="text-xl md:text-2xl font-bold text-white">{userStats.tournament_wins}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-3 md:p-4 col-span-2 md:col-span-1">
            <FaSkull className="text-2xl md:text-3xl text-red-400 mb-2" />
            <p className="text-xs text-discord-text mb-1 truncate">Total Kills</p>
            <p className="text-xl md:text-2xl font-bold text-white">{userStats.total_kills}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-bold text-white">Overall Progress</h3>
            <span className="text-sm font-bold text-purple-400">{completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-discord-darkest rounded-full h-3 md:h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'unlocked', 'locked', 'tournament', 'victory', 'combat', 'wealth'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold capitalize whitespace-nowrap transition-all text-sm md:text-base flex-shrink-0 ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaTrophy className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-lg md:text-xl text-white mb-2">No achievements found</p>
              <p className="text-sm md:text-base text-discord-text">Try a different filter</p>
            </div>
          ) : (
            filteredAchievements.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              const { current, progress } = getProgress(achievement);

              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-4 md:p-6 border-2 transition-all ${
                    unlocked
                      ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500'
                      : 'bg-discord-dark border-gray-800 opacity-75'
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute top-3 md:top-4 right-3 md:right-4">
                    {unlocked ? (
                      <FaCheckCircle className="text-xl md:text-2xl text-green-400" />
                    ) : (
                      <FaLock className="text-xl md:text-2xl text-gray-600" />
                    )}
                  </div>

                  {/* Category Icon */}
                  <div className="mb-3 md:mb-4">
                    {getCategoryIcon(achievement.category)}
                  </div>

                  {/* Achievement Name */}
                  <h3 className={`text-lg md:text-xl font-bold mb-2 pr-8 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs md:text-sm mb-3 md:mb-4 ${unlocked ? 'text-purple-200' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>

                  {/* Points */}
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <FaStar className={`text-sm md:text-base ${unlocked ? 'text-yellow-400' : 'text-gray-600'}`} />
                    <span className={`text-sm md:text-base font-bold ${unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {achievement.points} points
                    </span>
                  </div>

                  {/* Progress Bar (only for locked) */}
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
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-purple-700">
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
