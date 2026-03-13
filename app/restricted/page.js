'use client';

import { useBanCheck } from '@/hooks/useBanCheck';
import { FaBan, FaHome, FaVideo, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function RestrictedPage() {
  const { banStatus } = useBanCheck();

  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-discord-dark border border-red-600 rounded-xl p-8 text-center">
        <FaBan className="text-6xl text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">
          {banStatus?.ban_type === 'permanent' ? 'Account Banned' : 'Account Suspended'}
        </h1>
        
        {banStatus && (
          <>
            <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-300 mb-2"><strong>Reason:</strong> {banStatus.reason}</p>
              {banStatus.ban_type === 'temporary' && banStatus.expires_at && (
                <p className="text-red-300">
                  <strong>Expires:</strong> {new Date(banStatus.expires_at).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <p className="text-discord-text mb-6">
              Your access to tournaments and competitive features has been restricted.
              You can still browse limited sections of the platform.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Link href="/" className="p-4 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all">
                <FaHome className="text-2xl text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Home</p>
              </Link>
              <Link href="/videos" className="p-4 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all">
                <FaVideo className="text-2xl text-red-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Videos</p>
              </Link>
              <Link href="/info" className="p-4 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all">
                <FaInfoCircle className="text-2xl text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Info</p>
              </Link>
              <Link href="/help" className="p-4 bg-discord-darkest hover:bg-gray-700 rounded-lg transition-all">
                <FaBan className="text-2xl text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Help</p>
              </Link>
            </div>

            <p className="text-xs text-discord-text">
              If you believe this is a mistake, please contact support.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
