'use client';

import { FaUserShield, FaArrowLeft } from 'react-icons/fa';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 md:p-12 rounded-2xl mb-8 border border-blue-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaUserShield className="text-4xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-blue-100">
              Last Updated: March 9, 2026
            </p>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-blue-100 hover:text-white font-semibold transition-all"
        >
          <FaArrowLeft />
          Back to Home
        </a>
      </div>

      {/* Content */}
      <div className="bg-discord-dark border border-gray-800 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-discord-text mb-4">
              WarriorPixel Gaming ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our gaming platform.
            </p>
            <p className="text-discord-text">
              By using WarriorPixel, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-bold text-white mb-3">2.1 Personal Information</h3>
            <p className="text-discord-text mb-4">We collect information you provide directly:</p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4 mb-4">
              <li>Account information (username, email, password)</li>
              <li>Profile details (display name, avatar)</li>
              <li>In-game identifiers (IGN, UID for various games)</li>
              <li>Payment information (for deposits and withdrawals)</li>
              <li>Communication data (support tickets, messages)</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4 mb-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Tournament participation and performance data</li>
              <li>Wallet transaction history</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3">2.3 Third-Party Login Data</h3>
            <p className="text-discord-text">
              When you sign in via Google or Discord, we receive basic profile information as permitted by those services (name, email, profile picture).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-discord-text mb-4">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li>Provide and maintain our gaming services</li>
              <li>Process tournament registrations and prize distributions</li>
              <li>Manage your wallet and process transactions</li>
              <li>Verify your identity for security purposes</li>
              <li>Send important notifications about tournaments and account activity</li>
              <li>Improve our platform and develop new features</li>
              <li>Detect and prevent fraud, cheating, and abuse</li>
              <li>Comply with legal obligations and enforce our Terms</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
            <p className="text-discord-text mb-4">
              We do not sell your personal information. We may share your data in the following circumstances:
            </p>
            
            <h3 className="text-xl font-bold text-white mb-3">4.1 Service Providers</h3>
            <p className="text-discord-text mb-4">
              We work with third-party service providers for payment processing (Razorpay, UPI), hosting (Vercel, Supabase), and analytics. These providers have access only to information necessary to perform their functions.
            </p>

            <h3 className="text-xl font-bold text-white mb-3">4.2 Legal Requirements</h3>
            <p className="text-discord-text mb-4">
              We may disclose your information if required by law, court order, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-bold text-white mb-3">4.3 Business Transfers</h3>
            <p className="text-discord-text">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-discord-text mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure authentication via Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal information</li>
              <li>Two-factor authentication options (coming soon)</li>
            </ul>
            <p className="text-discord-text mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
            <p className="text-discord-text mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
              <li><strong className="text-white">Portability:</strong> Request your data in a portable format</li>
              <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong className="text-white">Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="text-discord-text mt-4">
              To exercise these rights, contact us at support@warriorpixel.in
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies & Tracking</h2>
            <p className="text-discord-text mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li><strong className="text-white">Essential Cookies:</strong> Required for authentication and security</li>
              <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how you use our platform</li>
              <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-discord-text mt-4">
              You can control cookies through your browser settings, but disabling them may affect platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
            <p className="text-discord-text mb-4">
              Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover we have collected data from a child, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Data Retention</h2>
            <p className="text-discord-text mb-4">
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-discord-text ml-4">
              <li>Legal compliance and record-keeping (up to 7 years for financial records)</li>
              <li>Fraud prevention and security</li>
              <li>Resolving disputes and enforcing agreements</li>
            </ul>
          </section>

          ection className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-discord-text mb-4">
              Your data is primarily stored on servers in India. If we transfer data internationally, we ensure appropriate safeguards are in place to protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-discord-text mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
            <p className="text-discord-text mb-4">
              If you have questions about this Privacy Policy or our data practices:
            </p>
            <ul className="list-none space-y-2 text-discord-text">
              <li><strong className="text-white">Email:</strong> privacy@warriorpixel.in</li>
              <li><strong className="text-white">Support:</strong> support@warriorpixel.in</li>
              <li><strong className="text-white">Discord:</strong> discord.gg/YOUR_DISCORD</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
