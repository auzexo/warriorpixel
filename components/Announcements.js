'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaBullhorn, FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';

export default function Announcements({ location = 'homepage' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    loadAnnouncements();
    loadDismissed();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const now = new Date().toISOString();
      
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (location === 'homepage') {
        query = query.eq('show_on_homepage', true);
      } else if (location === 'dashboard') {
        query = query.eq('show_on_dashboard', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadDismissed = () => {
    const stored = localStorage.getItem('dismissedAnnouncements');
    if (stored) {
      setDismissed(JSON.parse(stored));
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const getTypeConfig = (type) => {
    const configs = {
      info: {
        icon: FaInfoCircle,
        bg: 'from-blue-900 to-blue-800',
        border: 'border-blue-600',
        iconColor: 'text-blue-400'
      },
      success: {
        icon: FaCheckCircle,
        bg: 'from-green-900 to-green-800',
        border: 'border-green-600',
        iconColor: 'text-green-400'
      },
      warning: {
        icon: FaExclamationTriangle,
        bg: 'from-yellow-900 to-yellow-800',
        border: 'border-yellow-600',
        iconColor: 'text-yellow-400'
      },
      error: {
        icon: FaTimes,
        bg: 'from-red-900 to-red-800',
        border: 'border-red-600',
        iconColor: 'text-red-400'
      },
      tournament: {
        icon: FaBullhorn,
        bg: 'from-purple-900 to-purple-800',
        border: 'border-purple-600',
        iconColor: 'text-purple-400'
      },
      maintenance: {
        icon: FaExclamationTriangle,
        bg: 'from-gray-900 to-gray-800',
        border: 'border-gray-600',
        iconColor: 'text-gray-400'
      }
    };
    return configs[type] || configs.info;
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => {
        const config = getTypeConfig(announcement.type);
        const Icon = config.icon;

        return (
          <div
            key={announcement.id}
            className={`bg-gradient-to-r ${config.bg} border ${config.border} rounded-xl p-4 relative`}
          >
            <button
              onClick={() => handleDismiss(announcement.id)}
              className="absolute top-3 right-3 p-1 hover:bg-white hover:bg-opacity-10 rounded transition-all"
            >
              <FaTimes className="text-white text-sm" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <Icon className={`text-2xl ${config.iconColor} flex-shrink-0 mt-1`} />
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">{announcement.title}</h3>
                <p className="text-sm text-gray-200">{announcement.message}</p>
                
                {announcement.link_url && announcement.link_text && (
                  <a
                    href={announcement.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-white hover:text-gray-200 transition-colors"
                  >
                    {announcement.link_text}
                    <FaExternalLinkAlt className="text-xs" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
