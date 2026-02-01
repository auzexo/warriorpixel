// app/minecraft/page.js
'use client';

import { FaCube, FaShoppingCart, FaServer, FaNewspaper } from 'react-icons/fa';

export default function MinecraftPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-mc rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaCube className="text-green-400" />
          Minecraft
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Server shop, ranks, and exclusive items
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-primary-card rounded-xl overflow-hidden border border-white border-opacity-5">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 md:p-8 text-center">
          <FaCube className="text-6xl md:text-8xl mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Coming Soon</h2>
          <p className="text-lg md:text-xl text-white text-opacity-90 max-w-2xl mx-auto">
            We're working on an awesome Minecraft server with custom ranks, exclusive items, and much more!
          </p>
        </div>
      </div>

      {/* Planned Features */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
            <FaShoppingCart className="text-2xl text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Server Shop</h3>
          <p className="text-gray-400">
            Buy ranks, kits, and exclusive items using coins and gems
          </p>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
            <FaServer className="text-2xl text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Custom Server</h3>
          <p className="text-gray-400">
            Join our custom survival and creative servers with unique features
          </p>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
            <FaNewspaper className="text-2xl text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Updates & News</h3>
          <p className="text-gray-400">
            Stay updated with server events, updates, and community news
          </p>
        </div>
      </div>

      {/* Tebex Integration Info */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-4">What's Coming</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="font-semibold">VIP Ranks</p>
              <p className="text-sm text-gray-400">Premium, Elite, and Legendary ranks with exclusive perks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="font-semibold">Limited Items</p>
              <p className="text-sm text-gray-400">Exclusive items and kits available for purchase</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="font-semibold">Tebex Integration</p>
              <p className="text-sm text-gray-400">Secure payments through Tebex platform</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="font-semibold">Community Events</p>
              <p className="text-sm text-gray-400">Weekly building contests and survival challenges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notify Me */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 md:p-8 text-center">
        <h3 className="text-2xl font-bold mb-2">Get Notified</h3>
        <p className="text-white text-opacity-90 mb-6">
          Be the first to know when our Minecraft server launches!
        </p>
        <div className="max-w-md mx-auto">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm text-white text-opacity-80">
              Follow us on Discord and Instagram for updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
