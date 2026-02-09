'use client';

import { FaTrophy } from 'react-icons/fa';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-discord-darkest flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
          <FaTrophy className="text-white text-4xl" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-discord-text text-sm">Loading WarriorPixel...</p>
      </div>
    </div>
  );
}
