'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FaTrophy, 
  FaUsers, 
  FaFire, 
  FaGem, 
  FaChartLine,
  FaDiscord,
  FaInstagram,
  FaArrowRight,
  FaShieldAlt,
  FaCoins,
  FaYoutube,
  FaGamepad,
  FaWallet,
  FaStar,
  FaBolt,
  FaVideo
} from 'react-icons/fa';

export default function HomePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    liveTournaments: 0,
    totalPrizePool: 0,
    totalGuilds: 4
  });
  const [featuredTournaments, setFeaturedTournaments] = useState([]);

  useEffect(() => {
    loadStats();
    loadFeaturedTournaments();
  }, []);

  const loadStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: liveTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live');

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('prize_pool');

      const totalPrize = tournaments?.reduce((sum, t) => sum + parseFloat(t.prize_pool || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        liveTournaments: liveTournaments || 0,
        totalPrizePool: totalPrize,
        totalGuilds: 4
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFeaturedTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) throw error;
      setFeaturedTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const features = [
    {
      icon: FaTrophy,
      title: 'Epic Tournaments',
      description: 'Join competitive tournaments with real cash prizes and exclusive rewards',
      color: 'from-purple-600 to-purple-800',
      link: '/tournaments'
    },
    {
      icon: FaShieldAlt,
      title: 'Official Guilds',
      description: 'Join WarriorPixel Free Fire guilds and dominate with your team',
      color: 'from-blue-600 to-blue-800',
      link: '/freefire'
    },
    {
      icon: FaGem,
      title: 'Earn Rewards',
      description: 'Win real money, gems, coins, and exclusive vouchers by competing',
      color: 'from-green-600 to-green-800',
      link: '/wallet'
    },
    {
      icon: FaChartLine,
      title: 'Track Progress',
      description: 'Monitor your stats, achievements, and rise through the leaderboards',
      color: 'from-orange-600 to-orange-800',
      link: '/achievements'
    }
  ];

  const quickLinks = [
    {
      icon: FaGamepad,
      title: 'Browse Games',
      description: 'Explore our gaming section',
      link: '/games',
      color: 'bg-purple-600'
    },
    {
      icon: FaVideo,
      title: 'Watch Videos',
      description: 'Tutorials & highlights',
      link: '/videos',
      color: 'bg-red-600'
    },
    {
      icon: FaWallet,
      title: 'Manage Wallet',
      description: 'Check balance & withdraw',
      link: '/wallet',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-2xl mb-8 border border-purple-600">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10 p-8 md:p-16 text-center">
          {/* Logo */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white border-opacity-20">
            <FaTrophy className="text-4xl md:text-5xl text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to <span className="text-purple-300">WarriorPixel</span>
          </h1>
          <p className="text-lg md:text-2xl text-purple-100 mb-2 max-w-3xl mx-auto">
            India's Premier Gaming Platform
          </p>
          <p className="text-md md:text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Compete in tournaments, join guilds, and win real prizes
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/tournaments')}
                  className="px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <FaTrophy />
                  Browse Tournaments
                </button>
                <button
                  onClick={() => router.push('/freefire')}
                  className="px-8 py-4 bg-purple-600 bg-opacity-30 text-white rounded-xl font-bold text-lg hover:bg-opacity-40 transition-all border border-white border-opacity-30 flex items-center justify-center gap-2"
                >
                  <FaShieldAlt />
                  Join Guilds
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/tournaments')}
                  className="px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Get Started
                  <FaArrowRight />
                </button>
                <button
                  onClick={() => router.push('/info')}
                  className="px-8 py-4 bg-purple-600 bg-opacity-30 text-white rounded-xl font-bold text-lg hover:bg-opacity-40 transition-all border border-white border-opacity-30"
                >
                  Learn More
                </button>
              </>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <a
              href="https://discord.gg/CCDQt4pTRb"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-discord-blurple hover:bg-opacity-80 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all"
              title="Join our Discord"
            >
              <FaDiscord className="text-2xl text-white" />
            </a>
            <a
              href="https://instagram.com/warriorpixelofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:opacity-80 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all"
              title="Follow us on Instagram"
            >
              <FaInstagram className="text-2xl text-white" />
            </a>
            <a
              href="https://youtube.com/@warriorpixel"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-red-600 hover:bg-red-700 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all"
              title="Subscribe on YouTube"
            >
              <FaYoutube className="text-2xl text-white" />
            </a>
          </div>
          <p className="text-sm text-purple-200">
            Join our community for updates, support, and exclusive content
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 text-center hover:border-purple-600 transition-all">
          <FaUsers className="text-3xl md:text-4xl text-purple-400 mx-auto mb-2 md:mb-3" />
          <p className="text-2xl md:text-3xl font-bold text-white mb-1">
            {stats.totalUsers.toLocaleString()}+
          </p>
          <p className="text-xs md:text-sm text-discord-text">Active Players</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 text-center hover:border-orange-600 transition-all">
          <FaFire className="text-3xl md:text-4xl text-orange-400 mx-auto mb-2 md:mb-3" />
          <p className="text-2xl md:text-3xl font-bold text-white mb-1">
            {stats.liveTournaments}
          </p>
          <p className="text-xs md:text-sm text-discord-text">Live Tournaments</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 text-center hover:border-yellow-600 transition-all">
          <FaCoins className="text-3xl md:text-4xl text-yellow-400 mx-auto mb-2 md:mb-3" />
          <p className="text-2xl md:text-3xl font-bold text-white mb-1">
            ₹{stats.totalPrizePool.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm text-discord-text">Total Prize Pool</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 text-center hover:border-blue-600 transition-all">
          <FaShieldAlt className="text-3xl md:text-4xl text-blue-400 mx-auto mb-2 md:mb-3" />
          <p className="text-2xl md:text-3xl font-bold text-white mb-1">
            {stats.totalGuilds}
          </p>
          <p className="text-xs md:text-sm text-discord-text">Official Guilds</p>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
          Why Choose WarriorPixel?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                onClick={() => router.push(feature.link)}
                className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all cursor-pointer group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                  <Icon className="text-2xl text-white" />
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-discord-text mb-3">{feature.description}</p>
                <span className="text-purple-400 text-sm font-semibold flex items-center gap-1">
                  Explore <FaArrowRight className="text-xs" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Tournaments */}
      {featuredTournaments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Upcoming Tournaments</h2>
            <button
              onClick={() => router.push('/tournaments')}
              className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2 text-sm md:text-base"
            >
              View All
              <FaArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => router.push('/tournaments')}
                className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                    <FaBolt className="text-xs" />
                    UPCOMING
                  </span>
                  <FaTrophy className="text-2xl text-yellow-400 group-hover:scale-110 transition-all" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{tournament.title}</h3>
                <p className="text-sm text-discord-text mb-4">{tournament.game}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-discord-text">Prize Pool</p>
                    <p className="text-lg font-bold text-green-400">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-discord-text">Entry Fee</p>
                    <p className="text-lg font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <a
              key={index}
              href={link.link}
              className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all group flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-all`}>
                <Icon className="text-2xl text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">{link.title}</h3>
                <p className="text-xs text-discord-text">{link.description}</p>
              </div>
              <FaArrowRight className="text-purple-400" />
            </a>
          );
        })}
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 md:p-12 text-center border border-purple-500">
        <FaStar className="text-5xl text-yellow-300 mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Compete?
        </h2>
        <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
          Join thousands of players, compete in epic tournaments, and win real prizes!
        </p>
        <button
          onClick={() => router.push(user ? '/tournaments' : '/tournaments')}
          className="px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl inline-flex items-center gap-2"
        >
          {user ? 'Browse Tournaments' : 'Get Started Now'}
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
}
