'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaTrophy, FaLock, FaCheckCircle, FaChess, FaDice, FaFire } from 'react-icons/fa';

export default function AchievementsPage() {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, [profile]);

  const loadAchievements = async () => {
    setLoading(true);

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });

    // Get user's achievement progress
    let userProgress = [];
    if (profile) {
      const { data: progress } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.id);
      userProgress = progress || [];
    }

    setAchievements(allAchievements || []);
    setUserAchievements(userProgress);
    setLoading(false);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'chess':
        return FaChess;
      case 'ludo':
      case 'snake_ladder':
        return FaDice;
      case 'tournament':
        return FaTrophy;
      default:
        return FaFire;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'chess':
        return 'from-blue-500 to-cyan-500';
      case 'ludo':
        return 'from-green-500 to-emerald-500';
      case 'snake_ladder':
        return 'from-yellow-500 to-orange-500';
      case 'tournament':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getUserProgress = (achievementId) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'chess', label: 'Chess' },
    { id: 'ludo', label: 'Ludo' },
    { id: 'snake_ladder', label: 'Snake & Ladder' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const completedCount = userAchievements.filter(ua => ua.completed).length;
  const totalPoints = profile?.achievement_points || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaTrophy />
          Achievements
        </h1>
        <p className="text-white text-opacity-90">Complete challenges and earn rewards</p>
      </div>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Achievements Unlocked</p>
            <p className="text-3xl font-bold text-white">
              {completedCount}/{achievements.length}
            </p>
          </div>
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Achievement Points</p>
            <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-400">
              {achievements.length > 0 ? Math.round((completedCount / achievements.length) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white bg-opacity-5 text-discord-text hover:bg-opacity-10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-discord-text">Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => {
            const userProgress = getUserProgress(achievement.id);
            const isCompleted = userProgress?.completed || false;
            const progress = userProgress?.progress || 0;
            const Icon = getCategoryIcon(achievement.category);
            const colorClass = getCategoryColor(achievement.category);

            return (
              <div
                key={achievement.id}
                className={`bg-discord-dark rounded-xl p-6 border transition-all ${
                  isCompleted
                    ? 'border-yellow-500'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0 relative`}>
                    <Icon className="text-white text-2xl" />
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                        <FaCheckCircle className="text-white text-sm" />
                      </div>
                    )}
                    {!isCompleted && progress === 0 && (
                      <div className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1">
                        <FaLock className="text-gray-400 text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${isCompleted ? 'text-yellow-400' : 'text-white'}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-discord-text text-sm mb-3">{achievement.description}</p>

                    {/* Rewards */}
                    <div className="flex items-center gap-3 mb-3 text-sm">
                      <span className="text-yellow-400 font-semibold">+{achievement.points_reward} pts</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-orange-400 font-semibold">+{achievement.coins_reward} coins</span>
                    </div>

                    {/* Progress Bar */}
                    {!isCompleted && profile && (
                      <div>
                        <div className="flex justify-between text-xs text-discord-text mb-1">
                          <span>Progress</span>
                          <span>{progress}/{achievement.requirement_count}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all`}
                            style={{ width: `${(progress / achievement.requirement_count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                        <FaCheckCircle />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredAchievements.length === 0 && !loading && (
        <div className="text-center py-12 bg-discord-dark rounded-xl border border-gray-800">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-discord-text">No achievements found in this category</p>
        </div>
      )}
    </div>
  );
}
