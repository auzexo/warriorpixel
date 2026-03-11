'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/admin';
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
  FaCrown
} from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminSession, setAdminSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in using localStorage session
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        setAdminSession(JSON.parse(session));
      } catch (error) {
        console.error('Invalid admin session:', error);
        router.push('/admin');
      }
    } else {
      router.push('/admin');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('admin_session');
      router.push('/admin');
    }
  };

  // Complete navigation structure
  const navigationSections = [
    {
      title: 'Main',
      items: [
        { 
          name: 'Dashboard', 
          path: '/admin/dashboard', 
          icon: FaHome,
          permission: PERMISSIONS.TOURNAMENT_VIEW,
          exactMatch: true
        },
        { 
          name: 'Tournaments', 
          path: '/admin/tournaments', 
          icon: FaTrophy,
          permission: PERMISSIONS.TOURNAMENT_VIEW
        },
        { 
          name: 'Users', 
          path: '/admin/users', 
          icon: FaUsers,
          permission: PERMISSIONS.USER_VIEW
        },
        { 
          name: 'Guilds', 
          path: '/admin/guilds', 
          icon: FaShieldAlt,
          permission: PERMISSIONS.USER_VIEW
        }
      ]
    },
    {
      title: 'Content',
      items: [
        { 
          name: 'Announcements', 
          path: '/admin/announcements', 
          icon: FaBullhorn,
          permission: PERMISSIONS.ANNOUNCEMENT_CREATE
        },
        { 
          name: 'Videos & Content', 
          path: '/admin/content', 
          icon: FaVideo,
          permission: PERMISSIONS.ANNOUNCEMENT_CREATE
        }
      ]
    },
    {
      title: 'Financial',
      items: [
        { 
          name: 'Transactions', 
          path: '/admin/transactions', 
          icon: FaMoneyBillWave,
          permission: PERMISSIONS.USER_VIEW
        },
        { 
          name: 'Analytics', 
          path: '/admin/analytics', 
          icon: FaChartLine,
          permission: PERMISSIONS.LOGS_VIEW
        }
      ]
    },
    {
      title: 'System',
      items: [
        { 
          name: 'Admin Logs', 
          path: '/admin/logs', 
          icon: FaFileAlt,
          permission: PERMISSIONS.LOGS_VIEW
        },
        { 
          name: 'Permissions', 
          path: '/admin/permissions', 
          icon: FaKey,
          requireSuperAdmin: true
        },
        { 
          name: 'Settings', 
          path: '/admin/settings', 
          icon: FaCog,
          permission: PERMISSIONS.FULL_ACCESS
        }
      ]
    }
  ];

  const canAccessItem = (item) => {
    if (!adminSession) return false;
    
    // For items requiring super admin
    if (item.requireSuperAdmin) {
      return hasPermission(adminSession.permissions, PERMISSIONS.FULL_ACCESS);
    }
    
    // Check permission
    return hasPermission(adminSession.permissions, item.permission);
  };

  const isActive = (item) => {
    if (item.exactMatch) {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest">
      {/* Mobile Header */}
      <div className="lg:hidden bg-discord-dark border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
        {/* Hamburger on LEFT */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-all text-white"
        >
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        
        {/* Title in CENTER */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <FaCrown className="text-red-500 text-xl" />
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-discord-text">WarriorPixel</p>
          </div>
        </div>

        {/* Empty space on RIGHT for balance */}
        <div className="w-10"></div>
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
            {/* Logo/Title - Desktop Only */}
            <div className="p-6 border-b border-gray-800 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <FaCrown className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-discord-text">WarriorPixel</p>
                </div>
              </div>
            </div>

            {/* Navigation - Organized by Sections */}
            <nav className="flex-1 p-4 overflow-y-auto">
              {navigationSections.map((section) => {
                const sectionItems = section.items.filter(canAccessItem);
                if (sectionItems.length === 0) return null;

                return (
                  <div key={section.title} className="mb-6">
                    <p className="text-xs font-semibold text-discord-text uppercase tracking-wider mb-2 px-4">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {sectionItems.map((item) => {
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
                                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
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
                );
              })}
            </nav>

            {/* User Info & Sign Out */}
            <div className="p-4 border-t border-gray-800">
              <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
                    {profile?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{profile?.username || 'Admin'}</p>
                    <p className="text-xs text-discord-text flex items-center gap-1">
                      <FaUserShield className="text-red-400" />
                      {adminSession.permissions.includes('full_access') ? 'Super Admin' : 'Admin'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-discord-text">
                  <p>Permissions: {adminSession.permissions.includes('full_access') ? 'Full Access' : adminSession.permissions.length}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-600/50"
              >
                <FaSignOutAlt />
                Logout
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

        {/* Main Content - NO REDUNDANT HEADER */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
