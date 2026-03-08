'use client';

import { useState } from 'react';
import { FaDownload, FaAndroid, FaApple, FaGlobe, FaBell, FaCheckCircle, FaMobileAlt, FaTrophy, FaWallet, FaFire } from 'react-icons/fa';

export default function DownloadPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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

  const features = [
    {
      icon: FaTrophy,
      title: 'Join Tournaments',
      description: 'Access and join tournaments on the go, anytime, anywhere'
    },
    {
      icon: FaWallet,
      title: 'Manage Wallet',
      description: 'Check balance, withdraw winnings, and track transactions'
    },
    {
      icon: FaFire,
      title: 'Guild Management',
      description: 'Join guilds, chat with members, and coordinate matches'
    },
    {
      icon: FaBell,
      title: 'Push Notifications',
      description: 'Get instant alerts for tournaments, results, and updates'
    },
    {
      icon: FaMobileAlt,
      title: 'Optimized Performance',
      description: 'Smooth, fast experience designed specifically for mobile'
    },
    {
      icon: FaCheckCircle,
      title: 'Offline Access',
      description: 'View your stats and tournament history even offline'
    }
  ];

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 p-8 md:p-12 rounded-2xl mb-8 border border-green-500 text-center">
        <div className="w-20 h-20 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
          <FaDownload className="text-5xl text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Download WarriorPixel
        </h1>
        <p className="text-xl text-green-100 mb-6">
          Take the gaming platform with you, wherever you go
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8 mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Mobile Apps Coming Soon!</h2>
        <p className="text-discord-text mb-6 max-w-2xl mx-auto">
          We're hard at work building native Android and iOS apps to give you the best mobile gaming experience. In the meantime, you can access WarriorPixel through your mobile browser!
        </p>

        {/* App Store Buttons (Coming Soon) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-3 px-6 py-4 bg-gray-800 text-gray-500 rounded-xl cursor-not-allowed opacity-50"
            >
              <FaAndroid className="text-3xl" />
              <div className="text-left">
                <p className="text-xs">Coming Soon</p>
                <p className="font-bold">Google Play</p>
              </div>
            </button>
          </div>
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-3 px-6 py-4 bg-gray-800 text-gray-500 rounded-xl cursor-not-allowed opacity-50"
            >
              <FaApple className="text-3xl" />
              <div className="text-left">
                <p className="text-xs">Coming Soon</p>
                <p className="font-bold">App Store</p>
              </div>
            </button>
          </div>
        </div>

        {/* Email Notification */}
        <div className="bg-discord-darkest border border-gray-700 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaBell className="text-xl text-yellow-400" />
            <h3 className="font-bold text-white">Get Notified on Launch</h3>
          </div>
          
          {subscribed ? (
            <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2">
                <FaCheckCircle className="text-green-400 text-xl" />
                <p className="text-green-400 font-semibold">
                  You're on the list! We'll notify you when apps launch.
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
            Be the first to know when our mobile apps are ready!
          </p>
        </div>
      </div>

      {/* Web App Access */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 mb-8 border border-purple-500">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaGlobe className="text-4xl text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Use Web App Now!</h3>
            <p className="text-purple-100 mb-4">
              Access WarriorPixel directly from your mobile browser. Works on any device, no download required!
            </p>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
              <p className="text-white font-mono text-sm md:text-base break-all">
                warriorpixel.in
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <a
              href="/"
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-bold hover:bg-gray-100 transition-all inline-block"
            >
              Open Web App
            </a>
          </div>
        </div>
      </div>

      {/* App Features */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          What to Expect in Mobile Apps
        </h2>
        <p className="text-discord-text text-center mb-8">
          Our mobile apps will bring the complete WarriorPixel experience to your pocket
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-discord-darkest border border-gray-700 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-2xl text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-discord-text">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* PWA Instructions */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Add to Home Screen</h2>
        <p className="text-discord-text mb-6">
          Get app-like experience right now! Add WarriorPixel to your home screen for quick access.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Android Instructions */}
          <div className="bg-discord-darkest border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaAndroid className="text-3xl text-green-400" />
              <h3 className="font-bold text-white">Android / Chrome</h3>
            </div>
            <ol className="space-y-2 text-sm text-discord-text list-decimal list-inside">
              <li>Open warriorpixel.in in Chrome</li>
              <li>Tap the menu (⋮) in top right</li>
              <li>Tap "Add to Home screen"</li>
              <li>Tap "Add" to confirm</li>
              <li>Open from your home screen!</li>
            </ol>
          </div>

          {/* iOS Instructions */}
          <div className="bg-discord-darkest border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaApple className="text-3xl text-gray-300" />
              <h3 className="font-bold text-white">iPhone / Safari</h3>
            </div>
            <ol className="space-y-2 text-sm text-discord-text list-decimal list-inside">
              <li>Open warriorpixel.in in Safari</li>
              <li>Tap the Share button (⬆)</li>
              <li>Scroll and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
              <li>Open from your home screen!</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-600 bg-opacity-10 border border-blue-600 border-opacity-30 rounded-lg">
          <p className="text-sm text-discord-text text-center">
            💡 <strong className="text-white">Pro Tip:</strong> Once added to home screen, it works just like a native app!
          </p>
        </div>
      </div>

      {/* Expected Launch */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-center border border-purple-500">
        <FaMobileAlt className="text-6xl text-white mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Mobile Apps Expected</h3>
        <p className="text-3xl font-bold text-purple-100 mb-2">Q2-Q3 2026</p>
        <p className="text-purple-100">
          Follow us on Discord and Instagram for updates and sneak peeks!
        </p>
      </div>
    </div>
  );
}
