'use client';

import { FaDownload, FaAndroid, FaMobileAlt, FaCheckCircle, FaShieldAlt, FaBolt, FaTrophy } from 'react-icons/fa';

export default function DownloadPage() {
  const features = [
    {
      icon: FaBolt,
      title: 'Lightning Fast',
      description: 'Optimized performance for smooth gameplay tracking',
    },
    {
      icon: FaShieldAlt,
      title: 'Secure & Safe',
      description: 'Your data is encrypted and protected',
    },
    {
      icon: FaTrophy,
      title: 'Instant Notifications',
      description: 'Get tournament updates directly on your phone',
    },
    {
      icon: FaMobileAlt,
      title: 'Easy to Use',
      description: 'Simple interface designed for gamers',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Download APK',
      description: 'Click the download button below to get the latest version',
    },
    {
      number: 2,
      title: 'Enable Unknown Sources',
      description: 'Go to Settings > Security > Enable "Unknown Sources"',
    },
    {
      number: 3,
      title: 'Install App',
      description: 'Open the downloaded APK file and tap Install',
    },
    {
      number: 4,
      title: 'Login & Play',
      description: 'Open the app, login with your account, and start gaming!',
    },
  ];

  // In production, replace this with actual APK download link
  const handleDownload = () => {
    alert('APK download will be available soon! Stay tuned on Discord for updates.');
    // window.location.href = '/downloads/warriorpixel-v1.0.0.apk';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 md:p-8 text-center">
        <FaAndroid className="text-6xl text-white mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Download WarriorPixel App
        </h1>
        <p className="text-white text-opacity-90 mb-6">
          Get the official Android app for the best gaming experience
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-3 bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg"
        >
          <FaDownload className="text-2xl" />
          Download APK (v1.0.0)
        </button>
        <p className="text-white text-opacity-75 text-sm mt-4">
          Latest version • 25 MB • Android 7.0+
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-discord-dark rounded-xl p-6 border border-gray-800 text-center"
            >
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="text-white text-2xl" />
              </div>
              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-discord-text text-sm">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* Installation Steps */}
      <div className="bg-discord-dark rounded-xl p-6 md:p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">How to Install</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-discord-text text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshots Preview */}
      <div className="bg-discord-dark rounded-xl p-6 md:p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">App Screenshots</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-gray-700"
            >
              <FaMobileAlt className="text-gray-600 text-5xl" />
            </div>
          ))}
        </div>
        <p className="text-center text-discord-text text-sm mt-4">
          Screenshots coming soon!
        </p>
      </div>

      {/* What's New */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">What's New in v1.0.0</h2>
        <div className="space-y-3">
          {[
            'Initial release of WarriorPixel mobile app',
            'Browse and join tournaments on the go',
            'Real-time notifications for tournament updates',
            'View wallet balance and transaction history',
            'Track your achievements and progress',
            'Optimized for low-end devices',
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <FaCheckCircle className="text-green-400 flex-shrink-0 mt-1" />
              <p className="text-discord-text">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-white mb-4">Minimum Requirements</h3>
          <ul className="space-y-2 text-discord-text text-sm">
            <li>• Android 7.0 (Nougat) or higher</li>
            <li>• 2 GB RAM</li>
            <li>• 50 MB free storage</li>
            <li>• Internet connection required</li>
          </ul>
        </div>
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-white mb-4">Recommended</h3>
          <ul className="space-y-2 text-discord-text text-sm">
            <li>• Android 10 or higher</li>
            <li>• 4 GB RAM or more</li>
            <li>• 100 MB free storage</li>
            <li>• Wi-Fi or 4G connection</li>
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Common Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Is the app free?</h3>
            <p className="text-discord-text text-sm">Yes! The app is completely free to download and use.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Is it safe to install?</h3>
            <p className="text-discord-text text-sm">Absolutely! The APK is verified and scanned for malware. Always download from our official website.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">When is iOS version coming?</h3>
            <p className="text-discord-text text-sm">iOS version is in development. Follow us on Discord for updates!</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">How do I update the app?</h3>
            <p className="text-discord-text text-sm">We'll notify you in-app when updates are available. Download the new APK and install over the existing app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
