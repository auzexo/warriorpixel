'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Badge color styles
const BADGE_STYLES = {
  orange: {
    bg: 'bg-orange-900 bg-opacity-40',
    border: 'border-orange-600',
    text: 'text-orange-300',
    glow: 'shadow-orange-900',
  },
  purple: {
    bg: 'bg-purple-900 bg-opacity-40',
    border: 'border-purple-500',
    text: 'text-purple-300',
    glow: 'shadow-purple-900',
  },
  yellow: {
    bg: 'bg-yellow-900 bg-opacity-40',
    border: 'border-yellow-600',
    text: 'text-yellow-300',
    glow: 'shadow-yellow-900',
  },
  blue: {
    bg: 'bg-blue-900 bg-opacity-40',
    border: 'border-blue-600',
    text: 'text-blue-300',
    glow: 'shadow-blue-900',
  },
  red: {
    bg: 'bg-red-900 bg-opacity-40',
    border: 'border-red-600',
    text: 'text-red-300',
    glow: 'shadow-red-900',
  },
  gray: {
    bg: 'bg-gray-800',
    border: 'border-gray-600',
    text: 'text-gray-300',
    glow: '',
  },
};

const getTierLabel = (tier) => {
  if (tier === 'warrior') return '⚔️ Warrior';
  if (tier === 'premium') return '💎 Premium';
  return '';
};

export function UserBadges({ userId, compact = false }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });
      setBadges(data || []);
    } catch (e) {
      console.error('Badge load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || badges.length === 0) return null;

  if (compact) {
    // Inline compact mode — for use beside username
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map(badge => {
          const style = BADGE_STYLES[badge.badge_color] || BADGE_STYLES.gray;
          return (
            <span
              key={badge.id}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold border ${style.bg} ${style.border} ${style.text}`}
              title={`${badge.badge_icon} ${badge.badge_name} · ${getTierLabel(badge.badge_tier)}`}
            >
              {badge.badge_icon} {badge.badge_name}
            </span>
          );
        })}
      </div>
    );
  }

  // Full mode — for profile page badges section
  return (
    <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
      <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
        🏅 Season Badges
        <span className="text-xs text-discord-text font-normal">({badges.length})</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.map(badge => {
          const style = BADGE_STYLES[badge.badge_color] || BADGE_STYLES.gray;
          return (
            <div
              key={badge.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg ${style.bg} ${style.border} ${style.glow}`}
            >
              <span className="text-xl">{badge.badge_icon}</span>
              <div>
                <p className={`text-sm font-bold ${style.text}`}>{badge.badge_name}</p>
                <p className="text-xs text-gray-500">{getTierLabel(badge.badge_tier)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
