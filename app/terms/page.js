'use client';

import { FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 md:p-12 rounded-2xl mb-8 border border-purple-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaShieldAlt className="text-4xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Terms & Conditions
            </h1>
            <p className="text-purple-100">
              Last Updated: March 9, 2026
            </p>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-purple-100 hover:text-white font-semibold transition-all"
        >
          <FaArrowLeft />
          Back to Home
        </a>
      </div>

      {/* Content */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-discord-text mb-4">
              By accessing and using WarriorPixel ("the Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-discord-text">
              WarriorPixel is operated by WarriorPixel Gaming ("we", "us", or "our"). These terms govern your use of our website, mobile applications, and all related services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
            <p className="text-discord-text mb-4">
              <strong className="text-white">2.1 Account Creation:</strong> You must be at least 18 years old to create an account. By registering, you confirm that all information provided is accurate and current.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">2.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p className="text-discord-text">
              <strong className="text-white">2.3 One Account Policy:</strong> Each user is permitted only one account. Multiple accounts created by the same person will be subject to suspension or termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Tournaments & Competitions</h2>
            <p className="text-discord-text mb-4">
              <strong className="text-white">3.1 Entry Requirements:</strong> To participate in tournaments, you must provide accurate in-game information (IGN, UID, etc.). False information may result in disqualification and account suspension.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">3.2 Entry Fees:</strong> Some tournaments require entry fees. All fees are non-refundable once a tournament begins, except in cases of tournament cancellation by WarriorPixel.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">3.3 Fair Play:</strong> Cheating, hacking, exploiting bugs, or any form of unfair advantage is strictly prohibited. Violators will be permanently banned and forfeit all prizes.
            </p>
            <p className="text-discord-text">
              <strong className="text-white">3.4 Prize Distribution:</strong> Prizes are distributed within 24-48 hours after tournament completion. We reserve the right to withhold prizes pending investigation of any suspicious activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Wallet & Payments</h2>
            <p className="text-discord-text mb-4">
              <strong className="text-white">4.1 Wallet System:</strong> Your WarriorPixel wallet holds Real Money, Gems, Coins, and Vouchers. Each currency has specific uses as defined by the platform.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">4.2 Deposits:</strong> All deposits are final and non-refundable except as required by law or in cases of technical errors verified by us.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">4.3 Withdrawals:</strong> Minimum withdrawal amount is ₹100. Withdrawals are processed within 3-5 business days to verified payment methods only. We may charge processing fees for withdrawals below ₹500.
            </p>
            <p className="text-discord-text">
              <strong className="text-white">4.4 Verification:</strong> We reserve the right to request identity verification before processing withdrawals. Failure to provide requested documentation may result in withdrawal delays or denials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Guilds & Community</h2>
            <p className="text-discord-text mb-4">
              <strong className="text-white">5.1 Guild Membership:</strong> Users may join official WarriorPixel guilds subject to meeting the stated requirements. Guild leaders have the right to accept or reject applications.
            </p>
            <p className="text-discord-text">
              <strong className="text-white">5.2 Conduct:</strong> All guild members must adhere to our Community Guidelines. Harassment, hate speech, or toxic behavior will result in removal from guilds and potential account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Prohibited Activities</h2>
            <p className="text-discord-text mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li>Use cheats, hacks, bots, or third-party software</li>
              <li>Create multiple accounts to gain unfair advantages</li>
              <li>Engage in match-fixing or collusion</li>
              <li>Share or sell your account</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Attempt to exploit bugs or vulnerabilities</li>
              <li>Use VPNs or proxies to circumvent restrictions</li>
              <li>Engage in fraudulent transactions or chargebacks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-discord-text mb-4">
              All content on WarriorPixel, including logos, graphics, text, and software, is owned by WarriorPixel Gaming and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimers & Limitations</h2>
            <p className="text-discord-text mb-4">
              <strong className="text-white">8.1 Service Availability:</strong> We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for losses due to downtime, maintenance, or technical issues.
            </p>
            <p className="text-discord-text mb-4">
              <strong className="text-white">8.2 Third-Party Games:</strong> We are not affiliated with or endorsed by game developers (e.g., Free Fire, Minecraft). Issues with third-party games should be directed to their respective developers.
            </p>
            <p className="text-discord-text">
              <strong className="text-white">8.3 User Content:</strong> You are solely responsible for your in-game performance and any content you submit. We are not liable for user-generated content or interactions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Account Termination</h2>
            <p className="text-discord-text mb-4">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or for any reason we deem necessary to protect the platform or other users. Terminated users forfeit all wallet balances and prizes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. Modifications to Terms</h2>
            <p className="text-discord-text mb-4">
              We may update these Terms & Conditions at any time. Continued use of the Platform after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email or platform notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
            <p className="text-discord-text mb-4">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City], India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Information</h2>
            <p className="text-discord-text mb-4">
              For questions about these Terms & Conditions, please contact us:
            </p>
            <ul className="list-none space-y-2 text-discord-text">
              <li><strong className="text-white">Email:</strong> support@warriorpixel.in</li>
              <li><strong className="text-white">Discord:</strong> discord.gg/YOUR_DISCORD</li>
              <li><strong className="text-white">Instagram:</strong> @YOUR_INSTAGRAM</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
