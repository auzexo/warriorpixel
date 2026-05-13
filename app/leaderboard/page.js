'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  FaTrophy, FaMedal, FaCrown, FaStar, FaBolt, FaFire,
  FaGem, FaSkull, FaShieldAlt, FaChartLine, FaGamepad,
  FaSync, FaUser
} from 'react-icons/fa';

// ─── 10 RANK TIERS ───────────────────────────────────────────────
const RANK_TIERS = [
  { level: 1,  name: 'Rookie',      color: 'text-gray-400',   bg: 'bg-gray-800',   border: 'border-gray-600',   icon: '🥉', gradient: 'from-gray-700 to-gray-600' },
  { level: 2,  name: 'Warrior',     color: 'text-amber-600',  bg: 'bg-amber-900',  border: 'border-amber-700',  icon: '⚔️', gradient: 'from-amber-900 to-amber-800' },
  { level: 3,  name: 'Fighter',     color: 'text-blue-400',   bg: 'bg-blue-900',   border: 'border-blue-600',   icon: '🛡️', gradient: 'from-blue-900 to-blue-800' },
  { level: 4,  name: 'Champion',    color: 'text-teal-400',   bg: 'bg-teal-900',   border: 'border-teal-600',   icon: '🏆', gradient: 'from-teal-900 to-teal-800' },
  { level: 5,  name: 'Elite',       color: 'text-yellow-400', bg: 'bg-yellow-900', border: 'border-yellow-600', icon: '⭐', gradient: 'from-yellow-900 to-yellow-800' },
  { level: 6,  name: 'Master',      color: 'text-orange-400', bg: 'bg-orange-900', border: 'border-orange-600', icon: '🔥', gradient: 'from-orange-900 to-orange-800' },
  { level: 7,  name: 'Grandmaster', color: 'text-red-400',    bg: 'bg-red-900',    border: 'border-red-600',    icon: '💀', gradient: 'from-red-900 to-red-800' },
  { level: 8,  name: 'Legend',      color: 'text-purple-400', bg: 'bg-purple-900', border: 'border-purple-600', icon: '💎', gradient: 'from-purple-900 to-purple-800' },
  { level: 9,  name: 'Mythic',      color: 'text-pink-400',   bg: 'bg-pink-900',   border: 'border-pink-600',   icon: '👑', gradient: 'from-pink-900 to-pink-800' },
  { level: 10, name: 'Immortal',    color: 'text-yellow-300', bg: 'bg-yellow-900', border: 'border-yellow-400', icon: '💠', gradient: 'from-yellow-800 to-orange-700' },
];

const getRankTier = (level) => {
  const capped = Math.min(level || 1, 10);
  return RANK_TIERS[capped - 1];
};

const TABS = [
  { id: 'xp',           label: 'XP',           icon: FaStar,      field: 'xp',                color: 'text-yellow-400' },
  { id: 'wins',         label: 'Wins',          icon: FaTrophy,    field: 'total_wins',         color: 'text-green-400' },
  { id: 'achievements', label: 'Achievements',  icon: FaGem,       field: 'achievement_points', color: 'text-purple-400' },
  { id: 'level',        label: 'Level',         icon: FaChartLine, field: 'level',              color: 'text-blue-400' },
];

const POSITION_STYLES = [
  { bg: 'bg-yellow-900 bg-opacity-30', border: 'border-yellow-500', medal: '🥇', textColor: 'text-yellow-400', shadow: 'shadow-yellow-900' },
  { bg: 'bg-gray-700 bg-opacity-30',   border: 'border-gray-400',   medal: '🥈', textColor: 'text-gray-300',   shadow: 'shadow-gray-700' },
  { bg: 'bg-orange-900 bg-opacity-30', border: 'border-orange-600', medal: '🥉', textColor: 'text-orange-400', shadow: 'shadow-orange-900' },
];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('xp');
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const tab = TABS.find(t => t.id === activeTab);

      // Top 50 users for current tab
      const { data, error } = await supabase
        .from('users')
        .select('id, username, uid, level, xp, xp_to_next_level, total_wins, achievement_points')
        .order(tab.field, { ascending: false })
        .limit(50);

      if (error) throw error;

      setLeaders(data || []);
      setLastUpdated(new Date());

      // Find current user's rank
      if (user && data) {
        const rank = data.findIndex(u => u.id === user.id);
        if (rank !== -1) {
          setMyRank(rank + 1);
        } else {
          // User not in top 50 — fetch their actual position
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt(tab.field, profile?.[tab.field] || 0);
          setMyRank((count || 0) + 1);
        }
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDisplayValue = (user) => {
    const tab = TABS.find(t => t.id === activeTab);
    const val = user[tab.field] || 0;
    if (activeTab === 'xp') return `${val.toLocaleString()} XP`;
    if (activeTab === 'wins') return `${val} Wins`;
    if (activeTab === 'achievements') return `${val} pts`;
    if (activeTab === 'level') return `Level ${val}`;
    return val;
  };

  const getXPProgress = (u) => {
    if (!u.xp || !u.xp_to_next_level) return 0;
    return Math.min(100, (u.xp / u.xp_to_next_level) * 100);
  };

  return (
    <div className="min-h-screen bg-discord-darkest p-3 md:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FaTrophy className="text-3xl text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            <FaTrophy className="text-3xl text-yellow-400" />
          </div>
          <p className="text-discord-text text-sm">Top players on WarriorPixel</p>
          {lastUpdated && (
            <p className="text-xs text-gray-600 mt-1">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          )}
        </div>

        {/* Rank Tiers Reference */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-5 overflow-x-auto">
          <p className="text-xs text-discord-text mb-3 text-center font-semibold">RANK TIERS</p>
          <div className="flex gap-2 min-w-max mx-auto">
            {RANK_TIERS.map((tier) => (
              <div key={tier.level} className={`flex flex-col items-center px-2 py-1 rounded-lg border ${tier.border} ${tier.bg} bg-opacity-30`}>
                <span className="text-lg">{tier.icon}</span>
                <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
                <span className="text-xs text-gray-500">Lv.{tier.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Rank Card */}
        {user && profile && (
          <div className="bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-purple-400">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{profile.username}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getRankTier(profile.level).color}`}>
                      {getRankTier(profile.level).icon} {getRankTier(profile.level).name}
                    </span>
                    <span className="text-xs text-gray-400">Lv.{profile.level || 1}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-300 mb-1">YOUR RANK</p>
                <p className="text-3xl font-bold text-white">
                  {myRank ? `#${myRank}` : '—'}
                </p>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-purple-300 mb-1">
                <span>{profile.xp || 0} XP</span>
                <span>{profile.xp_to_next_level || 100} XP needed</span>
              </div>
              <div className="w-full bg-purple-950 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-purple-400 h-full rounded-full transition-all"
                  style={{ width: `${getXPProgress(profile)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl font-semibold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-discord-dark border-gray-700 text-discord-text hover:border-purple-600'
              }`}
            >
              <tab.icon className={`text-lg ${activeTab === tab.id ? 'text-white' : tab.color}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16">
            <FaTrophy className="text-5xl text-gray-600 mx-auto mb-4" />
            <p className="text-discord-text">No players yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((player, index) => {
              const position = index + 1;
              const isMe = user && player.id === user.id;
              const tier = getRankTier(player.level);
              const posStyle = position <= 3 ? POSITION_STYLES[position - 1] : null;

              return (
                <div
                  key={player.id}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-purple-900 bg-opacity-40 border-purple-500 ring-1 ring-purple-500'
                      : posStyle
                      ? `${posStyle.bg} ${posStyle.border} border`
                      : 'bg-discord-dark border-gray-800'
                  }`}
                >
                  {/* Rank Number */}
                  <div className="flex-shrink-0 w-10 text-center">
                    {position <= 3 ? (
                      <span className="text-2xl">{posStyle.medal}</span>
                    ) : (
                      <span className={`text-lg font-bold ${position <= 10 ? 'text-white' : 'text-gray-500'}`}>
                        #{position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                    isMe ? 'bg-purple-600 border-purple-400' : `bg-gradient-to-br ${tier.gradient} border-opacity-50 ${tier.border}`
                  }`}>
                    <span className="text-white">
                      {player.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-purple-300' : 'text-white'}`}>
                        {player.username}
                        {isMe && <span className="text-purple-400 text-xs ml-1">(you)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${tier.color}`}>
                        {tier.icon} {tier.name}
                      </span>
                      <span className="text-xs text-gray-500">Lv.{player.level || 1}</span>
                    </div>

                    {/* Mini XP bar for XP tab */}
                    {activeTab === 'xp' && (
                      <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-purple-500 h-full rounded-full"
                          style={{ width: `${getXPProgress(player)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-bold text-sm ${
                      position === 1 ? 'text-yellow-400' :
                      position === 2 ? 'text-gray-300' :
                      position === 3 ? 'text-orange-400' :
                      isMe ? 'text-purple-300' : 'text-white'
                    }`}>
                      {getDisplayValue(player)}
                    </p>
                    {activeTab !== 'level' && (
                      <p className="text-xs text-gray-500">{player.total_wins || 0}W</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer stats */}
        {!loading && leaders.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-discord-dark border border-gray-800 rounded-lg p-3 text-center">
              <FaUser className="text-xl text-blue-400 mx-auto mb-1" />
              <p className="text-white font-bold">{leaders.length}+</p>
              <p className="text-xs text-discord-text">Players</p>
            </div>
            <div className="bg-discord-dark border border-gray-800 rounded-lg p-3 text-center">
              <FaStar className="text-xl text-yellow-400 mx-auto mb-1" />
              <p className="text-white font-bold">{(leaders[0]?.xp || 0).toLocaleString()}</p>
              <p className="text-xs text-discord-text">Top XP</p>
            </div>
            <div className="bg-discord-dark border border-gray-800 rounded-lg p-3 text-center">
              <FaTrophy className="text-xl text-green-400 mx-auto mb-1" />
              <p className="text-white font-bold">{leaders[0]?.total_wins || 0}</p>
              <p className="text-xs text-discord-text">Top Wins</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
