// components/LoadingScreen.js
'use client';

import { FaShieldAlt } from 'react-icons/fa';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-main flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8 animate-pulse">
          <FaShieldAlt className="text-6xl text-purple-500 mx-auto" />
        </div>

        <div className="w-16 h-16 border-4 border-white border-opacity-10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>

        <p className="text-gray-400 text-lg">Loading WarriorPixel...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
