// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTournaments } from '@/lib/database';
import TournamentCard from '@/components/TournamentCard';
import { FaUsers, FaTrophy, FaCoins, FaFire, FaClock, FaGamepad, FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';

export default function Home() {
  const { userProfile } = useAuth();
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedTournaments();
  }, []);

  const loadFeaturedTournaments = async () => {
    setLoading(true);
    const result = await getTournaments({ limit: 3, status: 'upcoming' });
    if (result.success) {
      setFeaturedTournaments(result.data);
    }
    setLoading(false);
  };

  const stats = [
    {
      icon: FaUsers,
      value: '1,000+',
      label: 'Active Players',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      icon: FaTrophy,
      value: userProfile?.total_tournaments_played || 0,
      label: 'Tournaments Played',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: FaShieldAlt,
      value: userProfile?.total_wins || 0,
      label: 'Total Wins',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: FaCoins,
      value: userProfile?.achievement_points || 0,
      label: 'Achievement Points',
      gradient: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Welcome, {userProfile?.username || 'Warrior'}! 👋
          </h1>
          <p className="text-lg md:text-xl text-white text-opacity-90 mb-6 max-w-2xl">
            Join tournaments, earn rewards, and become a legend in the gaming community
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tournaments">
              <button className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-opacity-90 transition-all">
                <FaGamepad />
                Explore Tournaments
              </button>
            </Link>
            <Link href="/shop">
              <button className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-opacity-20 transition-all border border-white border-opacity-20">
                Visit Shop
              </button>
            </Link>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-primary-card rounded-xl p-4 md:p-6 border border-white border-opacity-5 hover:border-opacity-10 transition-all group"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="text-xl md:text-2xl text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Featured Tournaments */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FaFire className="text-orange-500" />
            Featured Tournaments
          </h2>
          <Link href="/tournaments">
            <button className="text-purple-400 hover:underline flex items-center gap-2 text-sm md:text-base">
              View All
              <span>→</span>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-primary-card rounded-xl h-64 skeleton"></div>
            ))}
          </div>
        ) : featuredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredTournaments.map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament}
                onClick={() => window.location.href = `/tournaments/${tournament.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="bg-primary-card rounded-xl p-8 md:p-12 text-center">
            <FaTrophy className="text-4xl md:text-5xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No featured tournaments at the moment</p>
            <Link href="/tournaments">
              <button className="mt-4 btn-primary">Browse All Tournaments</button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/freefire" className="block">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <FaFire className="text-3xl md:text-4xl mb-3" />
            <h3 className="text-lg md:text-xl font-bold mb-2">Free Fire</h3>
            <p className="text-white text-opacity-80 text-sm md:text-base">Join FF tournaments and guild</p>
          </div>
        </Link>

        <Link href="/minecraft" className="block">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <span className="text-3xl md:text-4xl mb-3">⛏️</span>
            <h3 className="text-lg md:text-xl font-bold mb-2">Minecraft</h3>
            <p className="text-white text-opacity-80 text-sm md:text-base">Server shop & updates</p>
          </div>
        </Link>

        <Link href="/wallet" className="block">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <FaTrophy className="text-3xl md:text-4xl mb-3" />
            <h3 className="text-lg md:text-xl font-bold mb-2">Your Wallet</h3>
            <p className="text-white text-opacity-80 text-sm md:text-base">Manage your balance</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
