'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  FaHome, 
  FaTrophy, 
  FaUsers, 
  FaBars, 
  FaTimes, 
  FaCog, 
  FaSignOutAlt, 
  FaBullhorn, 
  FaChartLine, 
  FaFileAlt, 
  FaMoneyBillWave, 
  FaShieldAlt, 
  FaUserShield,
  FaVideo,
  FaKey,
  FaExchangeAlt
} from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    try {
      const { data: whitelistEntry } = await supabase
        .from('super_admin_whitelist')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (!whitelistEntry) {
        alert('Access Denied: Admin privileges required');
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

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      router.push('/');
    }
  };

  // Complete navigation structure
  const navigationSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/admin', icon: FaHome, exactMatch: true },
        { name: 'Tournaments', path: '/admin/tournaments', icon: FaTrophy },
        { name: 'Users', path: '/admin/users', icon: FaUsers },
        { name: 'Guilds', path: '/admin/guilds', icon: FaShieldAlt }
      ]
    },
    {
      title: 'Content',
      items: [
        { name: 'Announcements', path: '/admin/announcements', icon: FaBullhorn },
        { name: 'Videos & Content', path: '/admin/content', icon: FaVideo }
      ]
    },
    {
      title: 'Financial',
      items: [
        { name: 'Transactions', path: '/admin/transactions', icon: FaMoneyBillWave },
        { name: 'Analytics', path: '/admin/analytics', icon: FaChartLine }
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Admin Logs', path: '/admin/logs', icon: FaFileAlt },
        { name: 'Permissions', path: '/admin/permissions', icon: FaKey },
        { name: 'Settings', path: '/admin/settings', icon: FaCog }
      ]
    }
  ];

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

  const isActive = (item) => {
    if (item.exactMatch) {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Mobile Header */}
      <div className="lg:hidden bg-discord-dark border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-discord-text">WarriorPixel</p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-all text-white"
        >
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-discord-dark border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo/Title */}
            <div className="p-6 border-b border-gray-800 hidden lg:block">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaUserShield className="text-purple-400" />
                Admin Panel
              </h1>
              <p className="text-sm text-discord-text mt-1">WarriorPixel Management</p>
            </div>

            {/* Navigation - Organized by Sections */}
            <nav className="flex-1 p-4 overflow-y-auto">
              {navigationSections.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="text-xs font-semibold text-discord-text uppercase tracking-wider mb-2 px-4">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item);

                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => {
                              router.push(item.path);
                              setSidebarOpen(false);
                            }}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3 rounded-lg
                              transition-all font-medium text-sm
                              ${active
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                                : 'text-discord-text hover:bg-gray-800 hover:text-white'
                              }
                            `}
                          >
                            <Icon className="text-lg flex-shrink-0" />
                            <span>{item.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* User Info & Sign Out */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                  <p className="text-xs text-discord-text flex items-center gap-1">
                    <FaUserShield className="text-purple-400" />
                    Super Admin
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-600/50"
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
