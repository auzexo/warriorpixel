'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FaFire, FaUsers, FaTrophy, FaDiscord, FaSearch, FaShieldAlt, FaInstagram, FaCrown, FaStar } from 'react-icons/fa';

export default function FreeFirePage() {
  const { user, profile } = useAuth();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);

  // WarriorPixel Official Guilds
  const wpGuilds = [
    {
      id: 1,
      name: 'WarriorPixel',
      tag: '[WP]',
      level: 5,
      members: 40,
      maxMembers: 55,
      description: 'Official WarriorPixel guild. Join the original warriors and dominate the battlefield with strategic gameplay.',
      requirements: 'Diamond+ in CS & BR, Player Level 30+',
      isOfficial: true,
      color: 'from-purple-600 to-purple-800',
    },
    {
      id: 2,
      name: 'WP Esports',
      tag: '[WPE]',
      level: 6,
      members: 40,
      maxMembers: 55,
      description: 'Elite competitive esports division. For serious tournament players ready to compete at the highest level.',
      requirements: 'Diamond+ in CS & BR, Player Level 30+',
      isOfficial: true,
      color: 'from-blue-600 to-blue-800',
    },
    {
      id: 3,
      name: 'WP Survivors',
      tag: '[WPS]',
      level: 2,
      members: 40,
      maxMembers: 55,
      description: 'Rising guild for determined survivors. Perfect for players looking to grow and prove themselves.',
      requirements: 'Diamond+ in CS & BR, Player Level 30+',
      isOfficial: true,
      color: 'from-green-600 to-green-800',
    },
    {
      id: 4,
      name: 'WP Akatsuki',
      tag: '[WPA]',
      level: 6,
      members: 40,
      maxMembers: 55,
      description: 'Elite ninja-themed guild inspired by legends. Join the shadows and strike with precision.',
      requirements: 'Diamond+ in CS & BR, Player Level 30+',
      isOfficial: true,
      color: 'from-red-600 to-red-800',
    },
  ];

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    // TODO: Later load from database
    // const { data } = await supabase.from('free_fire_guilds').select('*');
    setGuilds(wpGuilds);
    setLoading(false);
  };

  const filteredGuilds = guilds.filter(guild =>
    guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGuild = (guild) => {
    if (!user) {
      alert('Please login to join a guild');
      return;
    }
    setSelectedGuild(guild);
    setShowJoinModal(true);
  };

  const handleSubmitJoinRequest = () => {
    // TODO: Save to database and notify guild leaders
    alert('Guild join request submitted! Please join our Discord server to complete the process. Guild leaders will review your application within 24 hours.');
    setShowJoinModal(false);
    // Open Discord in new tab
    window.open('https://discord.gg/TvQBdaWpCn', '_blank');
  };

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-8 md:p-12 rounded-2xl mb-8 border border-blue-500">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaFire className="text-4xl text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Free Fire Guilds
            </h1>
            <p className="text-blue-100">
              Join official WarriorPixel guilds, compete in tournaments, and rise through the ranks
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://discord.gg/TvQBdaWpCn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-discord-blurple hover:bg-opacity-80 text-white rounded-lg font-semibold transition-all"
            >
              <FaDiscord className="text-xl" />
              <span className="hidden sm:inline">Join Discord</span>
            </a>
            <a
              href="https://www.instagram.com/wp_guilds_join"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 text-white rounded-lg font-semibold transition-all"
            >
              <FaInstagram className="text-xl" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center border border-white border-opacity-20">
            <FaShieldAlt className="text-2xl text-white mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{guilds.length}</p>
            <p className="text-xs text-blue-100">Official Guilds</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center border border-white border-opacity-20">
            <FaUsers className="text-2xl text-white mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {guilds.reduce((acc, g) => acc + g.members, 0)}
            </p>
            <p className="text-xs text-blue-100">Total Members</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center border border-white border-opacity-20">
            <FaTrophy className="text-2xl text-white mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {guilds.reduce((acc, g) => acc + g.level, 0)}
            </p>
            <p className="text-xs text-blue-100">Combined Level</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center border border-white border-opacity-20">
            <FaStar className="text-2xl text-white mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {guilds.reduce((acc, g) => acc + (g.maxMembers - g.members), 0)}
            </p>
            <p className="text-xs text-blue-100">Slots Available</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-600 bg-opacity-10 border border-blue-600 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <FaDiscord className="text-3xl text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-white mb-2">How to Join a Guild</h3>
            <ol className="text-discord-text text-sm space-y-1 list-decimal list-inside">
              <li>Click "Join Guild" on your preferred guild below</li>
              <li>Fill out the join request form with your Free Fire details</li>
              <li>Join our Discord server (link will open automatically)</li>
              <li>Wait for guild leaders to review (usually within 24 hours)</li>
              <li>You'll receive a Discord notification once approved!</li>
            </ol>
            <p className="text-blue-400 text-sm mt-3 font-semibold">
              💡 Tip: Make sure your Discord username matches your IGN for faster verification
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guilds by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-discord-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Guilds Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-discord-text mt-4">Loading guilds...</p>
        </div>
      ) : filteredGuilds.length === 0 ? (
        <div className="text-center py-12 bg-discord-dark rounded-xl border border-gray-800">
          <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
          <p className="text-discord-text">No guilds found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuilds.map((guild) => (
            <div
              key={guild.id}
              className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-all group"
            >
              {/* Guild Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 bg-gradient-to-br ${guild.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <FaShieldAlt className="text-white text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">{guild.name}</h3>
                      {guild.isOfficial && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          <FaCrown className="text-xs" />
                          <span>Official</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-blue-400 font-mono font-bold">{guild.tag}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-discord-text text-sm mb-4 leading-relaxed">
                {guild.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-discord-darkest rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FaUsers className="text-blue-400 text-sm" />
                    <p className="text-xs text-discord-text">Members</p>
                  </div>
                  <p className="text-white font-bold">
                    {guild.members}/{guild.maxMembers}
                  </p>
                  <div className="mt-2 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${(guild.members / guild.maxMembers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTrophy className="text-yellow-400 text-sm" />
                    <p className="text-xs text-discord-text">Guild Level</p>
                  </div>
                  <p className="text-white font-bold text-xl">{guild.level}</p>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-discord-darkest rounded-lg p-4 mb-4 border border-gray-700">
                <p className="text-xs text-discord-text mb-2 font-semibold">
                  ⚔️ Requirements:
                </p>
                <p className="text-white text-sm">{guild.requirements}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleJoinGuild(guild)}
                  disabled={guild.members >= guild.maxMembers}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    guild.members >= guild.maxMembers
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r ' + guild.color + ' text-white hover:opacity-90 shadow-lg'
                  }`}
                >
                  {guild.members >= guild.maxMembers ? 'Guild Full' : 'Join Guild'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && selectedGuild && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark rounded-2xl p-8 max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${selectedGuild.color} rounded-xl flex items-center justify-center`}>
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Join {selectedGuild.name}
                </h2>
                <p className="text-sm text-blue-400">{selectedGuild.tag}</p>
              </div>
            </div>

            <div className="bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg p-4 mb-6">
              <p className="text-sm text-white">
                <strong>📋 Before you apply:</strong> Make sure you meet the requirements and have joined our Discord server. Guild leaders will contact you there!
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Your Free Fire IGN <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="ff-ign"
                  placeholder="Enter your in-game name"
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Your Free Fire UID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="ff-uid"
                  placeholder="Enter your Free Fire UID"
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Your Discord Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="discord-username"
                  placeholder="username#1234"
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Player Level <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="player-level"
                  placeholder="Enter your player level"
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Why do you want to join? <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="join-reason"
                  rows="3"
                  placeholder="Tell us about yourself, your playstyle, and why you want to join..."
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJoinRequest}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${selectedGuild.color} hover:opacity-90 text-white rounded-lg font-semibold transition-all shadow-lg`}
              >
                Submit Request
              </button>
            </div>

            <p className="text-xs text-discord-text text-center mt-4">
              By submitting, you agree to follow guild rules and Discord guidelines
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
