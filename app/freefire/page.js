// app/freefire/page.js
'use client';

import { FaFire, FaUsers, FaYoutube, FaInstagram } from 'react-icons/fa';
import Image from 'next/image';

export default function FreeFirePage() {
  const guildInfo = {
    name: 'WARRIORPIXEL',
    level: 5,
    id: '3023987992',
    location: 'India | Odisha | Jharsuguda',
    seats: 55,
    requirements: [
      'Play with guild members',
      'Stay respectful to all',
      'Fair play (no cheats)',
      'Be active: 500 glory per week',
      'Min. Level 50',
      'Min. CS Rank: Diamond'
    ]
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-ff rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaFire className="text-blue-400" />
          Free Fire
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Join our guild, watch content, and participate in tournaments
        </p>
      </div>

      {/* Guild Recruitment */}
      <div className="bg-primary-card rounded-xl overflow-hidden border border-white border-opacity-5">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaUsers />
            Guild Recruitment
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Guild Image */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-96 bg-primary-darker rounded-lg overflow-hidden">
              <Image
                src="/mnt/user-data/uploads/file_0000000026fc71fd8dbe14a78456d334.png"
                alt="WarriorPixel Guild"
                fill
                className="object-contain"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 gradient-ff">{guildInfo.name}</h3>
                <p className="text-blue-400">Lv. {guildInfo.level} Free Fire Guild</p>
              </div>

              <div className="bg-white bg-opacity-5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Guild ID:</span>
                  <span className="font-mono font-bold">{guildInfo.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="font-semibold">{guildInfo.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Seats:</span>
                  <span className="font-semibold text-orange-400">LIMITED - {guildInfo.seats} PLAYERS</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 text-lg">Rules & Criteria</h4>
                <ul className="space-y-2">
                  {guildInfo.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">★</span>
                      <span className="text-gray-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
                  <FaFire />
                  Scan QR to Join Guild
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  QR code available in the recruitment image above
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Section */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaYoutube className="text-red-500" />
            Latest Videos
          </h2>
          <a 
            href="https://www.youtube.com/@warriorpixelofficial" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-sm"
          >
            View Channel →
          </a>
        </div>

        <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-8 text-center">
          <FaYoutube className="text-5xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Videos Yet</h3>
          <p className="text-gray-400 mb-4">
            Subscribe to our channel for upcoming gameplay, tutorials, and tournament highlights!
          </p>
          <a 
            href="https://www.youtube.com/@warriorpixelofficial" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              Subscribe Now
            </button>
          </a>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
        <h2 className="text-2xl font-bold mb-6">Connect With Us</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a 
            href="https://www.instagram.com/warriorpixelofficial/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg p-6 hover:scale-105 transition-transform"
          >
            <FaInstagram className="text-3xl mb-3" />
            <h3 className="font-bold mb-1">Instagram</h3>
            <p className="text-sm text-white text-opacity-80">@warriorpixelofficial</p>
          </a>

          <a 
            href="https://www.youtube.com/@warriorpixelofficial" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-red-600 to-rose-600 rounded-lg p-6 hover:scale-105 transition-transform"
          >
            <FaYoutube className="text-3xl mb-3" />
            <h3 className="font-bold mb-1">YouTube</h3>
            <p className="text-sm text-white text-opacity-80">@warriorpixelofficial</p>
          </a>

          <a 
            href="https://discord.gg/qpusTRqgBe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg p-6 hover:scale-105 transition-transform"
          >
            <svg className="w-8 h-8 mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <h3 className="font-bold mb-1">Discord</h3>
            <p className="text-sm text-white text-opacity-80">Join Server</p>
          </a>
        </div>
      </div>
    </div>
  );
}
