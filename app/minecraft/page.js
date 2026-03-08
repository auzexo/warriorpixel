'use client';

import { useState } from 'react';
import { FaCube, FaBell, FaCheckCircle, FaRocket } from 'react-icons/fa';

export default function MinecraftPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const features = [
    {
      title: 'Official Server',
      description: 'Join the WarriorPixel Minecraft server with custom plugins and mods'
    },
    {
      title: 'In-Game Shop',
      description: 'Purchase ranks, cosmetics, and items using your wallet balance'
    },
    {
      title: 'PvP Arenas',
      description: 'Compete in custom PvP arenas and earn tournament prizes'
    },
    {
      title: 'Custom Game Modes',
      description: 'SkyBlock, Survival, Creative, Minigames, and more!'
    },
    {
      title: 'Rank System',
      description: 'Level up your rank with exclusive perks and abilities'
    },
    {
      title: 'Community Events',
      description: 'Weekly events, building competitions, and special tournaments'
    }
  ];

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <FaCube className="text-5xl text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Minecraft Server
          </h1>
          <p className="text-xl text-discord-text mb-8">
            A premium Minecraft experience with custom content and rewards!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-discord-darkest border border-gray-700 rounded-xl p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-400 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-discord-text">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-600 bg-opacity-10 border border-green-600 border-opacity-30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaRocket className="text-2xl text-green-400" />
              <h3 className="text-lg font-bold text-white">Expected Launch</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">Q3 2026</p>
          </div>

          <div className="bg-discord-darkest border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FaBell className="text-xl text-yellow-400" />
              <h3 className="font-bold text-white">Get Notified on Launch</h3>
            </div>
            
            {subscribed ? (
              <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-green-400 text-xl" />
                  <p className="text-green-400 font-semibold">
                    You're on the list! We'll notify you at launch.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 bg-discord-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-600"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-lg whitespace-nowrap"
                >
                  Notify Me
                </button>
              </form>
            )}
            <p className="text-xs text-discord-text mt-3">
              We'll send you one email when this feature launches. No spam, ever.
            </p>
          </div>

          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-all"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
