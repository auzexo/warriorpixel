'use client';

import { FaDiscord, FaYoutube, FaInstagram, FaInfoCircle, FaUsers, FaEnvelope, FaQuestionCircle, FaExternalLinkAlt } from 'react-icons/fa';

export default function InfoPage() {
  const credits = [
    { name: 'Ninja Hazuto', role: 'Developer', color: 'from-red-500 to-orange-500' },
    { name: 'Phoenix', role: 'Community Manager', color: 'from-orange-500 to-yellow-500' },
    { name: 'Suraj', role: 'Tournament Coordinator', color: 'from-purple-500 to-pink-500' },
    { name: 'RDX Warrior', role: 'Moderator', color: 'from-blue-500 to-cyan-500' },
    { name: 'Prime', role: 'Supporter', color: 'from-green-500 to-emerald-500' },
    { name: 'Devourer', role: 'Technical Support', color: 'from-pink-500 to-purple-500' },
    { name: 'Innocent', role: 'Marketing Lead', color: 'from-cyan-500 to-blue-500' },
  ];

  const socialLinks = [
    {
      name: 'Discord Server',
      icon: FaDiscord,
      url: 'https://discord.gg/warriorpixel',
      color: 'bg-discord-purple',
      description: 'Join our community, get support, and participate in events',
    },
    {
      name: 'YouTube Channel',
      icon: FaYoutube,
      url: 'https://youtube.com/@warriorpixel',
      color: 'bg-red-600',
      description: 'Watch tournament highlights, tutorials, and gameplay',
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://instagram.com/warriorpixel',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      description: 'Follow for updates, clips, and behind-the-scenes content',
    },
  ];

  const faqs = [
    {
      question: 'How do I join a tournament?',
      answer: 'Browse tournaments, click on one you like, and click "Join Tournament". Make sure you have enough balance or vouchers to pay the entry fee.',
    },
    {
      question: 'How do I add money to my wallet?',
      answer: 'Go to the Wallet page and click "Add Money". You can use various payment methods including UPI, cards, and net banking.',
    },
    {
      question: 'What are vouchers and how do I use them?',
      answer: 'Vouchers are special tickets that let you join tournaments for free. When joining a tournament, you can select a voucher instead of paying with real money.',
    },
    {
      question: 'How do I see tournament room details?',
      answer: 'Room ID and password become visible 5 minutes before the tournament starts. Make sure you\'re registered for the tournament to see them.',
    },
    {
      question: 'Can I get a refund if I can\'t play?',
      answer: 'Refunds are only available if the tournament is cancelled by admins. Contact support on Discord for special cases.',
    },
    {
      question: 'How do achievements work?',
      answer: 'Complete specific tasks (like playing games or winning tournaments) to unlock achievements and earn points and coins.',
    },
    {
      question: 'How do I link my Discord account?',
      answer: 'Go to your profile settings and click "Link Discord". This allows you to get tournament updates directly on Discord.',
    },
    {
      question: 'What games are supported?',
      answer: 'We currently support Free Fire, BGMI, Stumble Guys, Minecraft, Valorant, and CODM. More games coming soon!',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaInfoCircle />
          Info & Help
        </h1>
        <p className="text-white text-opacity-90">Everything you need to know about WarriorPixel</p>
      </div>

      {/* Social Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-cyan-500 transition-all group"
            >
              <div className={`w-16 h-16 ${link.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="text-white text-3xl" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                {link.name}
                <FaExternalLinkAlt className="text-sm text-discord-text" />
              </h3>
              <p className="text-discord-text text-sm">{link.description}</p>
            </a>
          );
        })}
      </div>

      {/* About Section */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FaUsers />
          About WarriorPixel
        </h2>
        <div className="space-y-4 text-discord-text">
          <p>
            WarriorPixel is India's premier gaming tournament platform, bringing together gamers from across the country to compete, connect, and win amazing prizes.
          </p>
          <p>
            Founded in 2024, we've hosted hundreds of tournaments with thousands of players, distributing over ₹10 lakhs in prizes. Our platform supports multiple games and offers a seamless experience for both casual and competitive gamers.
          </p>
          <p>
            We believe in fair play, transparency, and building a strong gaming community. Join us and become part of the WarriorPixel family!
          </p>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Credits & Team</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {credits.map((member) => (
            <div key={member.name} className="text-center group">
              <div className={`w-20 h-20 bg-gradient-to-br ${member.color} rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform`}>
                {member.name.charAt(0)}
              </div>
              <p className="font-semibold text-white text-sm mb-1">{member.name}</p>
              <p className="text-xs text-discord-text">{member.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FaQuestionCircle />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white bg-opacity-5 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">{faq.question}</h3>
              <p className="text-discord-text text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
        <FaEnvelope className="text-5xl text-white mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Need More Help?</h2>
        <p className="text-white text-opacity-90 mb-4">
          Join our Discord server for instant support from our team and community
        </p>
        <a
          href="https://discord.gg/warriorpixel"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all"
        >
          <FaDiscord />
          Join Discord Server
          <FaExternalLinkAlt className="text-sm" />
        </a>
      </div>
    </div>
  );
}
