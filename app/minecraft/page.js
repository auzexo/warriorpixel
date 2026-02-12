'use client';

import { FaCube, FaShoppingCart, FaClock, FaBell } from 'react-icons/fa';
import { useState } from 'react';

export default function MinecraftPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      // In production, send email to backend
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 5000);
    }
  };

  const upcomingFeatures = [
    {
      icon: FaShoppingCart,
      title: 'Tebex Integration',
      description: 'Official Tebex shop for premium Minecraft items and ranks',
    },
    {
      icon: FaCube,
      title: 'Custom Items',
      description: 'Exclusive custom items, tools, and weapons',
    },
    {
      icon: FaClock,
      title: 'Limited Offers',
      description: 'Special limited-time deals and discounts',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-xl p-8 md:p-12 text-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-lg animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white rounded-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <FaCube className="text-8xl text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Minecraft Shop
          </h1>
          <div className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-lg mb-4">
            COMING SOON
          </div>
          <p className="text-white text-opacity-90 text-lg max-w-2xl mx-auto">
            We're building something awesome! Premium Minecraft items, ranks, and exclusive content will be available here soon.
          </p>
        </div>
      </div>

      {/* Notify Me */}
      <div className="bg-discord-dark rounded-xl p-8 border border-gray-800 text-center">
        <FaBell className="text-5xl text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-3">Get Notified When We Launch</h2>
        <p className="text-discord-text mb-6">
          Be the first to know when the Minecraft shop goes live and get exclusive launch offers!
        </p>

        {!subscribed ? (
          <form onSubmit={handleNotify} className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
              >
                Notify Me
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-400 font-semibold">✓ You're on the list! We'll notify you when we launch.</p>
          </div>
        )}
      </div>

      {/* What to Expect */}
      <div className="bg-discord-dark rounded-xl p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">What to Expect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-discord-text text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Items */}
      <div className="bg-discord-dark rounded-xl p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Coming to the Shop</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Ranks', 'Crates', 'Kits', 'Items', 'Commands', 'Perks', 'Cosmetics', 'Bundles'].map((item) => (
            <div
              key={item}
              className="bg-white bg-opacity-5 rounded-lg p-4 text-center hover:bg-opacity-10 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FaCube className="text-white" />
              </div>
              <p className="font-semibold text-white text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stay Updated */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Stay Updated</h2>
        <p className="text-white text-opacity-90 mb-4">
          Join our Discord server for exclusive sneak peeks and launch announcements
        </p>
        <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all">
          Join Discord
        </button>
      </div>
    </div>
  );
}
