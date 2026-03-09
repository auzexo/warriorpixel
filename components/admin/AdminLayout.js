'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaTrophy, 
  FaShieldAlt,
  FaVideo,
  FaBullhorn,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        alert('Access denied: Admin privileges required');
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { icon: FaTachometerAlt, label: 'Dashboard', path: '/admin', color: 'text-purple-400' },
    { icon: FaUsers, label: 'Users', path: '/admin/users', color: 'text-blue-400' },
    { icon: FaTrophy, label: 'Tournaments', path: '/admin/tournaments', color: 'text-yellow-400' },
    { icon: FaShieldAlt, label: 'Guilds', path: '/admin/guilds', color: 'text-green-400' },
    { icon: FaVideo, label: 'Videos', path: '/admin/videos', color: 'text-red-400' },
    { icon: FaBullhorn, label: 'Announcements', path: '/admin/announcements', color: 'text-orange-400' },
    { icon: FaCog, label: 'Settings', path: '/admin/settings', color: 'text-gray-400' }
  ];

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Mobile Header */}
      <div className="lg:hidden bg-discord-dark border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-all"
        >
          {sidebarOpen ? <FaTimes className="text-white text-xl" /> : <FaBars className="text-white text-xl" />}
        </button>
        <h1 className="text-lg font-bold text-white">👑 Admin Panel</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-discord-dark border-r border-gray-800 
          transition-transform duration-300 z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-2 hidden lg:block">👑 Admin Panel</h1>
            <p className="text-sm text-discord-text hidden lg:block">WarriorPixel Dashboard</p>
          </div>

          <nav className="px-3 flex-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  router.push(item.path);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-all mb-2 group"
              >
                <item.icon className={`text-xl ${item.color} group-hover:scale-110 transition-all`} />
                <span className="text-white font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-all"
            >
              <FaSignOutAlt className="text-white" />
              <span className="text-white font-semibold">Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global CSS for dark inputs */}
      <style jsx global>{`
        /* Admin Panel Input Styling */
        #__next input[type="text"],
        #__next input[type="email"],
        #__next input[type="password"],
        #__next input[type="number"],
        #__next input[type="datetime-local"],
        #__next textarea,
        #__next select {
          background-color: #0a0a0f !important;
          border: 1px solid #374151 !important;
          color: #ffffff !important;
          padding: 0.75rem 1rem !important;
          border-radius: 0.5rem !important;
        }

        #__next input::placeholder,
        #__next textarea::placeholder {
          color: #6b7280 !important;
        }

        #__next input:focus,
        #__next textarea:focus,
        #__next select:focus {
          outline: none !important;
          border-color: #7c3aed !important;
        }

        /* Fix white text inputs */
        .admin-input {
          background-color: #0a0a0f !important;
          border: 1px solid #374151 !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
