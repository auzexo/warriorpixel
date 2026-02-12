'use client';

import { useState } from 'react';
import { FaFire, FaUsers, FaTrophy, FaDiscord, FaExternalLinkAlt } from 'react-icons/fa';

export default function FreeFirePage() {
  const [selectedGuild, setSelectedGuild] = useState(null);

  const guilds = [
    {
      id: 1,
      name: 'Ninja Warriors',
      tag: '[NW]',
      leader: 'Ninja Hazuto',
      members: 48,
      maxMembers: 50,
      level: 15,
      description: 'Elite Free Fire guild focused on competitive ranked matches and tournaments. We participate in weekly scrims and monthly tournaments.',
      requirements: [
        'K/D ratio above 2.5',
        'Heroic or above rank',
        'Active daily player',
        'Age 16+',
        'Must have Discord',
      ],
      discordLink: 'https://discord.gg/ninjawarriors',
      color: 'from-red-500 to-orange-500',
    },
    {
      id: 2,
      name: 'Phoenix Rising',
      tag: '[PHX]',
      leader: 'Phoenix',
      members: 45,
      maxMembers: 50,
      level: 12,
      description: 'Casual-competitive guild welcoming all skill levels. Focus on teamwork, learning, and having fun together while improving.',
      requirements: [
        'Gold rank or above',
        'Respectful behavior',
        'Active 3+ times per week',
        'Team player mindset',
      ],
      discordLink: 'https://discord.gg/phoenixrising',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      id: 3,
      name: 'RDX Squad',
      tag: '[RDX]',
      leader: 'RDX Warrior',
      members: 50,
      maxMembers: 50,
      level: 18,
      description: 'Premium competitive guild. Tournament specialists with multiple championship wins. Only accepting experienced players.',
      requirements: [
        'Diamond or above',
        'Tournament experience required',
        'K/D above 3.0',
        'Must attend weekly practice',
        'Tryouts mandatory',
      ],
      discordLink: 'https://discord.gg/rdxsquad',
      color: 'from-purple-500 to-pink-500',
      featured: true,
    },
    {
      id: 4,
      name: 'Prime Legends',
      tag: '[PRM]',
      leader: 'Prime',
      members: 42,
      maxMembers: 50,
      level: 14,
      description: 'Mid-tier competitive guild focusing on clan wars and ranked push. Great community for improving your gameplay.',
      requirements: [
        'Platinum rank minimum',
        'Active communication',
        'Participate in clan wars',
        'Positive attitude',
      ],
      discordLink: 'https://discord.gg/primelegends',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaFire />
          Free Fire Guilds
        </h1>
        <p className="text-white text-opacity-90">Join our competitive Free Fire guilds and dominate the battlefield</p>
      </div>

      {/* Info Banner */}
      <div className="bg-discord-dark rounded-xl p-4 border border-orange-500">
        <p className="text-discord-text text-sm">
          <span className="text-orange-400 font-bold">Note:</span> To join a guild, contact the guild leader on Discord. Make sure you meet the requirements before applying!
        </p>
      </div>

      {/* Guilds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {guilds.map((guild) => (
          <div
            key={guild.id}
            className={`bg-discord-dark rounded-xl p-6 border ${
              guild.featured ? 'border-purple-500' : 'border-gray-800'
            } hover:border-orange-500 transition-all cursor-pointer relative overflow-hidden`}
            onClick={() => setSelectedGuild(selectedGuild?.id === guild.id ? null : guild)}
          >
            {/* Featured Badge */}
            {guild.featured && (
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                FEATURED
              </div>
            )}

            {/* Guild Header */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-16 h-16 bg-gradient-to-br ${guild.color} rounded-xl flex items-center justify-center text-2xl font-bold text-white`}>
                  {guild.tag}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{guild.name}</h3>
                  <p className="text-sm text-discord-text">Led by {guild.leader}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white bg-opacity-5 rounded-lg p-3 text-center">
                <FaUsers className="text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-discord-text">Members</p>
                <p className="font-bold text-white">{guild.members}/{guild.maxMembers}</p>
              </div>
              <div className="bg-white bg-opacity-5 rounded-lg p-3 text-center">
                <FaTrophy className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-discord-text">Level</p>
                <p className="font-bold text-white">{guild.level}</p>
              </div>
              <div className="bg-white bg-opacity-5 rounded-lg p-3 text-center">
                <FaFire className="text-red-400 mx-auto mb-1" />
                <p className="text-xs text-discord-text">Status</p>
                <p className={`font-bold ${guild.members < guild.maxMembers ? 'text-green-400' : 'text-red-400'}`}>
                  {guild.members < guild.maxMembers ? 'OPEN' : 'FULL'}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-discord-text text-sm mb-4">{guild.description}</p>

            {/* Expandable Requirements */}
            {selectedGuild?.id === guild.id && (
              <div className="mt-4 animate-fadeIn">
                <h4 className="font-bold text-white mb-2">Requirements:</h4>
                <ul className="space-y-2 mb-4">
                  {guild.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-discord-text flex items-center gap-2">
                      <span className="text-orange-400">•</span>
                      {req}
                    </li>
                  ))}
                </ul>

                <a
                  href={guild.discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-discord-purple hover:bg-discord-purple-dark text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaDiscord />
                  Join Discord Server
                  <FaExternalLinkAlt className="text-sm" />
                </a>
              </div>
            )}

            {/* Expand Indicator */}
            {!selectedGuild || selectedGuild.id !== guild.id ? (
              <p className="text-center text-sm text-orange-400 mt-4">Click to view requirements & join</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* How to Join */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">How to Join a Guild</h2>
        <div className="space-y-3 text-discord-text">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-semibold text-white">Choose a Guild</p>
              <p className="text-sm">Select a guild that matches your skill level and playstyle</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-semibold text-white">Check Requirements</p>
              <p className="text-sm">Make sure you meet all the requirements before applying</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-semibold text-white">Join Discord</p>
              <p className="text-sm">Click the "Join Discord Server" button and contact the guild leader</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
            <div>
              <p className="font-semibold text-white">Send In-Game Request</p>
              <p className="text-sm">Send a guild join request in Free Fire with your WarriorPixel UID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
