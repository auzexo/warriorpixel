// components/ClientLayout.js
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from './AuthModal';
import LoadingScreen from './LoadingScreen';

const ClientLayout = ({ children }) => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const getPageTitle = () => {
    const titles = {
      '/': 'HOME',
      '/freefire': 'FREE FIRE',
      '/minecraft': 'MINECRAFT',
      '/tournaments': 'TOURNAMENTS',
      '/wallet': 'WALLET',
      '/shop': 'SHOP',
      '/admin': 'ADMIN PANEL',
      '/info': 'INFO & HELP',
      '/download': 'DOWNLOAD APP',
    };
    return titles[pathname] || 'WARRIORPIXEL';
  };

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
        <AuthModal isOpen={showAuthModal} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Topbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          pageTitle={getPageTitle()}
        />
        
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
