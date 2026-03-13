'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatISTDate } from '@/lib/timeUtils';
import { FaBan, FaHome, FaVideo, FaInfoCircle, FaQuestionCircle, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

export default function RestrictedPage() {
  const { user } = useAuth();
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBanStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadBanStatus = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: bans } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Find active ban
      const activeBan = bans?.find(ban => {
        if (ban.ban_type === 'permanent') return true;
        if (ban.ban_type === 'temporary' && ban.expires_at) {
          return new Date(ban.expires_at) > new Date();
        }
        return false;
      });

      setBanStatus(activeBan || null);
    } catch (error) {
      console.error('Error loading ban status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-discord-dark border border-gray-800 rounded-xl p-8 text-center">
          <FaExclamationTriangle className="text-5xl text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-discord-text mb-6">Please log in to access this page.</p>
          <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold inline-block">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!banStatus) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-discord-dark border border-green-600 rounded-xl p-8 text-center">
          <FaExclamationTriangle className="text-5xl text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Account Active</h1>
          <p className="text-discord-text mb-6">Your account is in good standing. You have full access to the platform.</p>
          <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold inline-block">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Main Restriction Notice */}
        <div className="bg-discord-dark border border-red-600 rounded-xl p-8 text-center mb-6">
          <FaBan className="text-7xl text-red-400 mx-auto mb-6 animate-pulse" />
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {banStatus.ban_type === 'permanent' ? 'Account Banned' : 'Account Suspended'}
          </h1>
          
          <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-5 mb-6">
            <p className="text-red-300 text-lg mb-3">
              <strong>Reason:</strong> {banStatus.reason}
            </p>
            
            {banStatus.ban_type === 'temporary' && banStatus.expires_at && (
              <div className="mb-3">
                <p className="text-red-300 text-lg">
                  <strong>Expires:</strong> {formatISTDate(banStatus.expires_at, true)}
                </p>
                <p className="text-xs text-red-400 mt-2">
                  Your access will be automatically restored after this date.
                </p>
              </div>
            )}
            
            <p className="text-sm text-red-400 mt-3">
              Banned on: {formatISTDate(banStatus.created_at, true)}
            </p>
          </div>

          {banStatus.ban_type === 'permanent' ? (
            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                This is a <strong>permanent ban</strong>. Your access to tournaments and competitive features is permanently restricted.
              </p>
            </div>
          ) : (
            <div className="bg-orange-900 bg-opacity-20 border border-orange-600 rounded-lg p-4 mb-6">
              <p className="text-orange-300 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                This is a <strong>temporary suspension</strong>. Your full access will be restored once the suspension expires.
              </p>
            </div>
          )}

          <p className="text-discord-text mb-6 text-base">
            Your access to tournaments, wallet features, and competitive functions has been restricted. However, you can still browse limited sections of the platform.
          </p>
        </div>

        {/* Allowed Pages */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">📖 You Can Still Access</h2>
          <p className="text-discord-text text-center mb-6 text-sm">
            Browse these sections while your account has restricted access
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link 
              href="/" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaHome className="text-3xl text-blue-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">Home</p>
              <p className="text-discord-text text-xs">Main page</p>
            </Link>
            
            <Link 
              href="/videos" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaVideo className="text-3xl text-red-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">Videos</p>
              <p className="text-discord-text text-xs">Watch content</p>
            </Link>
            
            <Link 
              href="/info" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaInfoCircle className="text-3xl text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">Info</p>
              <p className="text-discord-text text-xs">Platform info</p>
            </Link>
            
            <Link 
              href="/help" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaQuestionCircle className="text-3xl text-yellow-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">Help</p>
              <p className="text-discord-text text-xs">Support center</p>
            </Link>
            
            <Link 
              href="/downloads" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaDownload className="text-3xl text-purple-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">Downloads</p>
              <p className="text-discord-text text-xs">Get files</p>
            </Link>
            
            <Link 
              href="/about" 
              className="p-5 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all text-center border border-gray-700 hover:border-purple-600"
            >
              <FaInfoCircle className="text-3xl text-cyan-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">About</p>
              <p className="text-discord-text text-xs">About us</p>
            </Link>
          </div>
        </div>

        {/* Support Message */}
        <div className="mt-6 bg-discord-dark border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-sm text-discord-text mb-2">
            If you believe this {banStatus.ban_type === 'permanent' ? 'ban' : 'suspension'} is a mistake, please contact support.
          </p>
          <Link 
            href="/help" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all"
          >
            <FaQuestionCircle />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
