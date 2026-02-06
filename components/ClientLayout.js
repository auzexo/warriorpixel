'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from './AuthModal';
import LoadingScreen from './LoadingScreen';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Auto-show auth modal when user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Page titles
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

  // Show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // If not logged in, show landing page with auth modal
  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-5xl">🎮</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                WarriorPixel
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12">
              India's Premier Gaming Tournament Platform
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 transition-all">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="font-bold text-xl mb-3">Compete & Win</h3>
                <p className="text-gray-400">Join daily tournaments and win real cash prizes</p>
              </div>

              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 transition-all">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="font-bold text-xl mb-3">Real Money Prizes</h3>
                <p className="text-gray-400">Secure payments & instant withdrawals to your account</p>
              </div>

              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-10 transition-all">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="font-bold text-xl mb-3">Popular Games</h3>
                <p className="text-gray-400">Free Fire, BGMI, Minecraft and more</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-16 py-5 rounded-full font-bold text-xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </button>

            <p className="mt-8 text-gray-400">
              Join <span className="text-purple-400 font-semibold">1000+</span> gamers competing for{' '}
              <span className="text-green-400 font-semibold">₹50,000+</span> in prizes daily
            </p>
          </div>
        </div>

        {/* Auth Modal - Shows automatically or when button clicked */}
        {showAuthModal && (
          <AuthModal onClose={() => {
            // Don't allow closing modal if not logged in
            // User must login to access site
          }} />
        )}
      </>
    );
  }

  // User is logged in - show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
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
