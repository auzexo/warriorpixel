// app/info/page.js
'use client';

import { FaInfoCircle, FaDiscord, FaInstagram, FaYoutube, FaEnvelope, FaQuestionCircle, FaShieldAlt } from 'react-icons/fa';

export default function InfoPage() {
  const features = [
    {
      title: 'Tournaments',
      description: 'Join competitive tournaments for Free Fire, BGMI, and Stumble Guys. Win real money prizes!',
      icon: '🏆'
    },
    {
      title: 'Wallet System',
      description: 'Manage your balance with real money, gems, coins, and vouchers. Instant withdrawals via PhonePe.',
      icon: '💰'
    },
    {
      title: 'Shop',
      description: 'Buy gems, vouchers, and exclusive items. Zero charges on UPI payments.',
      icon: '🛒'
    },
    {
      title: 'Achievements',
      description: 'Complete challenges, earn points, and unlock exclusive rewards.',
      icon: '🏅'
    },
    {
      title: 'Guild System',
      description: 'Join our Free Fire guild and play with the community.',
      icon: '👥'
    },
    {
      title: 'Discord Integration',
      description: 'Link your Discord account for notifications and community chat.',
      icon: '💬'
    }
  ];

  const team = [
    'Sanket', 'Ayush', 'Suraj', 'Dipan', 'Om', 'Devourer', 'Innocent'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaInfoCircle />
          Info & Help
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Learn about WarriorPixel, get help, and connect with us
        </p>
      </div>

      {/* About WarriorPixel */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-purple-500" />
          About WarriorPixel
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          WarriorPixel is a gaming community platform where players can participate in competitive tournaments, 
          earn rewards, and connect with fellow gamers. We host tournaments for popular games like Free Fire, 
          BGMI, and Stumble Guys, with real money prizes and a fair, transparent system.
        </p>
        <p className="text-gray-300 leading-relaxed">
          Our mission is to create a thriving gaming ecosystem where skill meets opportunity. Join thousands 
          of players who trust WarriorPixel for competitive gaming and rewards.
        </p>
      </div>

      {/* Features */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-6">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-white bg-opacity-5 rounded-lg p-4 hover:bg-opacity-10 transition-all">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FaQuestionCircle className="text-blue-500" />
          How It Works
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="font-bold mb-1">Create Account</h3>
              <p className="text-sm text-gray-400">Sign up with email, Google, or Discord</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="font-bold mb-1">Add Money</h3>
              <p className="text-sm text-gray-400">Add funds to your wallet via PhonePe (zero charges on UPI)</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="font-bold mb-1">Join Tournaments</h3>
              <p className="text-sm text-gray-400">Browse tournaments, pay entry fee, and get your seat number</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="font-bold mb-1">Play & Win</h3>
              <p className="text-sm text-gray-400">Get room ID 5 minutes before match, play, and win prizes!</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">5</div>
            <div>
              <h3 className="font-bold mb-1">Withdraw</h3>
              <p className="text-sm text-gray-400">Instant withdrawal to your UPI (₹10 - ₹1800 per day)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-6">Contact & Support</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-4">Get Help</h3>
            <div className="space-y-3">
              <a 
                href="https://discord.gg/qpusTRqgBe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-indigo-600 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                <FaDiscord className="text-2xl text-indigo-400" />
                <div>
                  <p className="font-semibold">Discord Server</p>
                  <p className="text-sm text-gray-400">Join for support & community</p>
                </div>
              </a>
              <a 
                href="mailto:wpgames.moderator@gmail.com"
                className="flex items-center gap-3 p-3 bg-red-600 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                <FaEnvelope className="text-2xl text-red-400" />
                <div>
                  <p className="font-semibold">Email Support</p>
                  <p className="text-sm text-gray-400">wpgames.moderator@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Follow Us</h3>
            <div className="space-y-3">
              <a 
                href="https://www.instagram.com/warriorpixelofficial/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-pink-600 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                <FaInstagram className="text-2xl text-pink-400" />
                <div>
                  <p className="font-semibold">Instagram</p>
                  <p className="text-sm text-gray-400">@warriorpixelofficial</p>
                </div>
              </a>
              <a 
                href="https://www.youtube.com/@warriorpixelofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-red-600 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                <FaYoutube className="text-2xl text-red-400" />
                <div>
                  <p className="font-semibold">YouTube</p>
                  <p className="text-sm text-gray-400">@warriorpixelofficial</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 md:p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Credits & Team</h2>
        <p className="text-white text-opacity-90 mb-6">
          WarriorPixel is made possible by our amazing team and community
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {team.map((member, index) => (
            <span 
              key={index}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-full font-semibold"
            >
              {member}
            </span>
          ))}
        </div>
        <p className="text-white text-opacity-80 italic">
          Special thanks to all developers, moderators, players, and users who support WarriorPixel.
          Your trust and participation make this platform thrive. Together, we're building the best
          gaming community in India! 🎮🔥
        </p>
        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
          <p className="text-sm text-white text-opacity-70">
            © 2024 WarriorPixel by Auzexo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
