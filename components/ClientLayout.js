'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from './AuthModal';
import LoadingScreen from './LoadingScreen';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const pageTitles = {
    '/': 'Home',
    '/tournaments': 'Tournaments',
    '/wallet': 'Wallet',
    '/shop': 'Shop',
    '/freefire': 'Free Fire',
    '/minecraft': 'Minecraft',
    '/info': 'Info & Help',
    '/download': 'Download App',
    '/admin': 'Admin Panel',
  };

  const currentTitle = pageTitles[pathname] || 'WarriorPixel';

  useEffect(() => {
    document.title = `${currentTitle} - WarriorPixel`;
  }, [currentTitle]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
            {/* Logo */}
            <div className="mb-12">
              <h1 className="text-6xl md:text-8xl font-black mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  WarriorPixel
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-light">
                India's Premier Gaming Tournament Platform
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="group bg-white bg-opacity-5 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3">Compete & Win</h3>
                <p className="text-gray-400 text-sm">Join daily tournaments and win real cash prizes</p>
              </div>

              <div className="group bg-white bg-opacity-5 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3">Real Money Prizes</h3>
                <p className="text-gray-400 text-sm">Secure payments & instant withdrawals</p>
              </div>

              <div className="group bg-white bg-opacity-5 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3">Popular Games</h3>
                <p className="text-gray-400 text-sm">Free Fire, BGMI, Minecraft and more</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative">Get Started</span>
              <svg className="relative ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Stats */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-bold text-purple-400">1000+</p>
                <p className="text-gray-400">Active Players</p>
              </div>
              <div className="w-px h-12 bg-white bg-opacity-10"></div>
              <div>
                <p className="text-2xl font-bold text-green-400">₹50,000+</p>
                <p className="text-gray-400">Daily Prizes</p>
              </div>
              <div className="w-px h-12 bg-white bg-opacity-10"></div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">24/7</p>
                <p className="text-gray-400">Tournaments</p>
              </div>
            </div>
          </div>
        </div>

        {showAuthModal && <AuthModal onClose={() => {}} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar onMenuToggle={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
