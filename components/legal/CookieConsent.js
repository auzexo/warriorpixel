'use client';

import { useState, useEffect } from 'react';
import { FaCookie } from 'react-icons/fa';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-6xl mx-auto glass-strong rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0">
            <FaCookie className="text-4xl text-yellow-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              🍪 We use cookies
            </h3>
            <p className="text-sm text-discord-text">
              We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
              By clicking "Accept", you consent to our use of cookies. 
              Read our{' '}
              <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                Privacy Policy
              </a>
              {' '}and{' '}
              <a href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                Terms of Service
              </a>
              .
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={declineCookies}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all btn-glow"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
