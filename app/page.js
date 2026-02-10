'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FaTrophy, FaGamepad, FaUsers, FaCoins, FaFire, FaCube, FaVideo } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: FaTrophy,
      title: 'Tournament System',
      description: 'Compete in Free Fire, BGMI, and more gaming tournaments',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FaGamepad,
      title: 'Casual Games',
      description: 'Play Ludo, Chess, Snake & Ladder for real money',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: FaUsers,
      title: 'Free Fire Guilds',
      description: 'Join multiple guilds and connect with players',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: FaCoins,
      title: 'Multiple Currencies',
      description: 'Earn Real Money, Gems, Coins, and Vouchers',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: FaCube,
      title: 'Minecraft Shop',
      description: 'Premium Minecraft items coming soon',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FaVideo,
      title: 'Video Content',
      description: 'Watch gaming videos from top creators',
      color: 'from-pink-500 to-purple-500',
    },
  ];

  const stats = [
    { label: 'Active Players', value: '1,000+', color: 'text-purple-400' },
    { label: 'Daily Prizes', value: '₹50,000+', color: 'text-green-400' },
    { label: 'Games Available', value: '10+', color: 'text-cyan-400' },
    { label: 'Tournaments', value: '24/7', color: 'text-orange-400' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-discord-darkest via-discord-dark to-discord-darkest py-20">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <FaTrophy className="text-white text-5xl" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                WarriorPixel
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-discord-text font-light mb-8">
              India's Premier Gaming Tournament Platform
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {user ? (
              <button
                onClick={() => router.push('/tournaments')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                View Tournaments
              </button>
            ) : (
              <button
                onClick={() => router.push('/tournaments')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                Get Started - Play Now
              </button>
            )}
            
            <button
              onClick={() => router.push('/videos')}
              className="px-8 py-4 bg-discord-dark hover:bg-discord-darker border-2 border-purple-500 text-white rounded-lg font-bold text-lg transition-all"
            >
              Watch Videos
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-discord-dark bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <p className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
                <p className="text-sm text-discord-text">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">What We Offer</h2>
          <p className="text-discord-text text-lg">Everything you need for competitive gaming</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-discord-dark hover:bg-discord-darker rounded-xl p-6 border border-gray-800 hover:border-purple-500 transition-all duration-300 transform hover:scale-105"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-discord-text text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-discord-dark py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-discord-text text-lg">Start playing in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create Account</h3>
              <p className="text-discord-text">Sign up with Email, Google, or Discord</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Add Money</h3>
              <p className="text-discord-text">Secure payment gateway integration</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Play & Win</h3>
              <p className="text-discord-text">Join tournaments and earn rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Start?</h2>
        {!user && (
          <button
            onClick={() => router.push('/tournaments')}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-xl shadow-2xl transition-all transform hover:scale-105"
          >
            Join WarriorPixel Today
          </button>
        )}
      </div>
    </div>
  );
}
