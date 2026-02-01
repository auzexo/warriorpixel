// app/download/page.js
'use client';

import { FaDownload, FaAndroid, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';

export default function DownloadPage() {
  const features = [
    'Faster performance',
    'Offline access to profile',
    'Push notifications',
    'Quick tournament joining',
    'Native mobile experience',
    'Auto-updates'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-center">
        <FaMobileAlt className="text-6xl md:text-8xl mx-auto mb-4 opacity-80" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Download WarriorPixel App</h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Get the best gaming experience on your Android device
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-primary-card rounded-xl p-8 md:p-12 text-center border border-white border-opacity-5">
        <div className="w-20 h-20 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaAndroid className="text-5xl text-green-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Android App Coming Soon!</h2>
        <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
          We're working hard to bring you the best mobile experience. The WarriorPixel Android app 
          will be available for download very soon.
        </p>
        <div className="inline-block bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg px-6 py-3">
          <p className="text-yellow-400 font-semibold">
            📱 Currently in development - Stay tuned!
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-6 text-center">What You'll Get</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white bg-opacity-5 rounded-lg">
              <FaCheckCircle className="text-green-400 text-xl flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Me */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 md:p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Get Notified</h3>
        <p className="text-white text-opacity-90 mb-6">
          Be the first to download when the app launches!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://discord.gg/qpusTRqgBe" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all">
              Join Discord for Updates
            </button>
          </a>
          <a 
            href="https://www.instagram.com/warriorpixelofficial/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <button className="bg-white bg-opacity-20 text-white px-8 py-3 rounded-lg font-bold hover:bg-opacity-30 transition-all border border-white border-opacity-20">
              Follow on Instagram
            </button>
          </a>
        </div>
      </div>

      {/* Meanwhile */}
      <div className="bg-primary-card rounded-xl p-6 text-center border border-white border-opacity-5">
        <h3 className="text-xl font-bold mb-3">Meanwhile, use our website!</h3>
        <p className="text-gray-400 mb-4">
          You can access all features through your mobile browser. Add this website to your home screen for quick access.
        </p>
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-400">
            <strong>Tip:</strong> Tap the share icon in your browser and select "Add to Home Screen" 
            to create a shortcut on your phone!
          </p>
        </div>
      </div>
    </div>
  );
}
