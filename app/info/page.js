'use client';

import { useState } from 'react';
import { FaInfoCircle, FaQuestionCircle, FaDiscord, FaInstagram, FaEnvelope, FaTrophy, FaWallet, FaUsers, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function InfoPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create an account?',
      answer: 'Click the "Login" button in the top right corner, then choose to sign up with Email, Google, or Discord. Fill in your details and you\'re ready to go!'
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'What is WarriorPixel?',
      answer: 'WarriorPixel is a gaming platform where you can join tournaments, compete with other players, join guilds, and earn rewards. We focus on Free Fire, but more games are coming soon!'
    },
    {
      id: 3,
      category: 'Tournaments',
      question: 'How do I join a tournament?',
      answer: 'Go to the Tournaments page, browse available tournaments, and click "Join Tournament" on any upcoming event. Fill in your in-game details and you\'re registered!'
    },
    {
      id: 4,
      category: 'Tournaments',
      question: 'What happens if a tournament is full?',
      answer: 'If a tournament reaches maximum capacity, you won\'t be able to join. Keep an eye out for new tournaments posted regularly!'
    },
    {
      id: 5,
      category: 'Tournaments',
      question: 'How do I receive my tournament winnings?',
      answer: 'Tournament prizes are automatically credited to your wallet within 24-48 hours after the tournament ends. Check your Wallet page to view your balance.'
    },
    {
      id: 6,
      category: 'Wallet & Payments',
      question: 'What currencies does WarriorPixel use?',
      answer: 'We have 4 currencies: Real Money (₹), Gems, Coins, and Vouchers (₹20, ₹30, ₹50). Each can be used for different purposes on the platform.'
    },
    {
      id: 7,
      category: 'Wallet & Payments',
      question: 'How do I withdraw my winnings?',
      answer: 'Go to your Wallet page, click "Withdraw", enter the amount and your payment details (UPI/Bank). Withdrawals are processed within 3-5 business days.'
    },
    {
      id: 8,
      category: 'Wallet & Payments',
      question: 'Are there any withdrawal fees?',
      answer: 'Minimum withdrawal is ₹100. No fees for withdrawals above ₹500. Below ₹500, a small processing fee may apply.'
    },
    {
      id: 9,
      category: 'Guilds',
      question: 'How do I join a Free Fire guild?',
      answer: 'Visit the Free Fire Guilds page, browse available guilds, and click "Join Guild". Fill out the application form and join our Discord. Guild leaders will review your application within 24 hours.'
    },
    {
      id: 10,
      category: 'Guilds',
      question: 'Can I be in multiple guilds?',
      answer: 'No, you can only be a member of one guild at a time. You can leave your current guild and join another if desired.'
    },
    {
      id: 11,
      category: 'Account & Security',
      question: 'How do I change my password?',
      answer: 'If you signed up with email, go to your profile settings and click "Change Password". For Google/Discord login, manage your password through those platforms.'
    },
    {
      id: 12,
      category: 'Account & Security',
      question: 'I forgot my password, what should I do?',
      answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send you a reset link. Check your spam folder if you don\'t see it.'
    },
    {
      id: 13,
      category: 'Support',
      question: 'How do I contact support?',
      answer: 'Join our Discord server for fastest support, DM us on Instagram, or email support@warriorpixel.in. We typically respond within 24 hours.'
    },
    {
      id: 14,
      category: 'Support',
      question: 'How do I report a bug or issue?',
      answer: 'Report bugs on our Discord server in the #bug-reports channel, or email us at support@warriorpixel.in with detailed information about the issue.'
    }
  ];

  const categories = [...new Set(faqs.map(faq => faq.category))];

  const quickLinks = [
    {
      title: 'Join Tournaments',
      description: 'Browse and join upcoming gaming tournaments',
      icon: FaTrophy,
      link: '/tournaments',
      color: 'from-purple-600 to-purple-800'
    },
    {
      title: 'Manage Wallet',
      description: 'View balance, withdraw winnings, and transaction history',
      icon: FaWallet,
      link: '/wallet',
      color: 'from-green-600 to-green-800'
    },
    {
      title: 'Free Fire Guilds',
      description: 'Join official WarriorPixel Free Fire guilds',
      icon: FaUsers,
      link: '/freefire',
      color: 'from-blue-600 to-blue-800'
    }
  ];

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-8 md:p-12 rounded-2xl mb-8 border border-purple-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaInfoCircle className="text-4xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Info & Help Center
            </h1>
            <p className="text-purple-100">
              Everything you need to know about using WarriorPixel
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <a
              key={index}
              href={link.link}
              className="bg-discord-dark border border-gray-800 rounded-xl p-6 hover:border-purple-600 transition-all group"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                <Icon className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">{link.title}</h3>
              <p className="text-sm text-discord-text">{link.description}</p>
            </a>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaQuestionCircle className="text-3xl text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-600 bg-opacity-20 text-purple-400 rounded-full text-sm font-semibold border border-purple-600 border-opacity-30"
            >
              {category}
            </span>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-discord-darkest border border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-all text-left"
              >
                <div className="flex-1">
                  <span className="text-xs text-purple-400 font-semibold mb-1 block">
                    {faq.category}
                  </span>
                  <h3 className="font-semibold text-white">{faq.question}</h3>
                </div>
                {openFaq === faq.id ? (
                  <FaChevronUp className="text-purple-400 flex-shrink-0 ml-4" />
                ) : (
                  <FaChevronDown className="text-gray-500 flex-shrink-0 ml-4" />
                )}
              </button>
              {openFaq === faq.id && (
                <div className="px-6 py-4 border-t border-gray-700 bg-discord-dark">
                  <p className="text-discord-text">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Need More Help?</h2>
        <p className="text-discord-text mb-6">
          Can't find what you're looking for? Reach out to our support team and we'll help you out!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discord */}
          <a
            href="https://discord.gg/EQGZs8xRPE"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-discord-blurple hover:bg-opacity-80 rounded-xl p-6 transition-all group text-center"
          >
            <FaDiscord className="text-5xl text-white mx-auto mb-4 group-hover:scale-110 transition-all" />
            <h3 className="font-bold text-white mb-2">Discord Server</h3>
            <p className="text-sm text-blue-100 mb-3">Fastest support & community help</p>
            <span className="text-white font-semibold">Join Server →</span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/warriorpixelofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-purple-600 to-pink-600 hover:opacity-80 rounded-xl p-6 transition-all group text-center"
          >
            <FaInstagram className="text-5xl text-white mx-auto mb-4 group-hover:scale-110 transition-all" />
            <h3 className="font-bold text-white mb-2">Instagram</h3>
            <p className="text-sm text-purple-100 mb-3">DM us for quick responses</p>
            <span className="text-white font-semibold">Follow Us →</span>
          </a>

          {/* Email */}
          <a
            href="mailto:wpgames.moderator@gmail.com"
            className="bg-gray-700 hover:bg-gray-600 rounded-xl p-6 transition-all group text-center"
          >
            <FaEnvelope className="text-5xl text-white mx-auto mb-4 group-hover:scale-110 transition-all" />
            <h3 className="font-bold text-white mb-2">Email Support</h3>
            <p className="text-sm text-gray-300 mb-3">Response within 24 hours</p>
            <span className="text-white font-semibold">Send Email →</span>
          </a>
        </div>

        <div className="mt-6 p-4 bg-purple-600 bg-opacity-10 border border-purple-600 border-opacity-30 rounded-lg">
          <p className="text-sm text-discord-text text-center">
            <strong className="text-white">Support Hours:</strong> Monday - Saturday, 10 AM - 8 PM IST
          </p>
        </div>
      </div>

      {/* Platform Rules */}
      <div className="mt-8 bg-discord-dark border border-gray-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Platform Rules</h2>
        <div className="space-y-3 text-discord-text">
          <p>✅ Be respectful to all players and staff</p>
          <p>✅ No cheating, hacking, or use of third-party tools</p>
          <p>✅ One account per person</p>
          <p>✅ Provide accurate in-game information</p>
          <p>❌ No spam, harassment, or abusive language</p>
          <p>❌ No sharing accounts or selling services</p>
          <p>❌ No fraudulent transactions or chargebacks</p>
        </div>
        <div className="mt-6">
          <a href="/terms" className="text-purple-400 hover:text-purple-300 font-semibold">
            Read Full Terms & Conditions →
          </a>
        </div>
      </div>
    </div>
  );
}
