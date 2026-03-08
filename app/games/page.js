'use client';

import { useState } from 'react';
import { FaGamepad, FaBell, FaCheckCircle, FaRocket } from 'react-icons/fa';

export default function GamesPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const features = [
    {
      title: 'Multiple Games',
      description: 'Play a variety of browser-based games directly on WarriorPixel'
    },
    {
      title: 'Earn Rewards',
      description: 'Win coins, gems, and vouchers by playing and winning games'
    },
    {
      title: 'Leaderboards',
      description: 'Compete with other players and climb the global rankings'
    },
    {
      title: 'Daily Challenges',
      description: 'Complete challenges for bonus rewards and achievements'
    },
    {
      title: 'Multiplayer Modes',
      description: 'Challenge friends or play against random opponents online'
    },
    {
      title: 'Tournament Integration',
      description: 'Special gaming tournaments with exclusive prizes'
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
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <FaGamepad className="text-5xl text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Games Section
          </h1>
          <p className="text-xl text-discord-text mb-8">
            Get ready for an epic collection of browser games with rewards!
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

          <div className="bg-purple-600 bg-opacity-10 border border-purple-600 border-opacity-30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaRocket className="text-2xl text-purple-400" />
              <h3 className="text-lg font-bold text-white">Expected Launch</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">Q2 2026</p>
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
                  className="flex-1 px-4 py-3 bg-discord-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-lg whitespace-nowrap"
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
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-all"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
