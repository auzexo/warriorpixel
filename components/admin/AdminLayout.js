'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/admin';
import { FaTrophy, FaUsers, FaBullhorn, FaHistory, FaCrown, FaSignOutAlt, FaBars, FaTimes, FaLock } from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminSession, setAdminSession] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    const session = localStorage.getItem('admin_session');
    if (session) {
      setAdminSession(JSON.parse(session));
    } else {
      router.push('/admin');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    router.push('/admin');
  };

  const menuItems = [
    {
      icon: FaTrophy,
      label: 'Tournament Management',
      path: '/admin/dashboard',
      permission: PERMISSIONS.TOURNAMENT_CREATE,
    },
    {
      icon: FaUsers,
      label: 'User Management',
      path: '/admin/users',
      permission: PERMISSIONS.USER_VIEW,
    },
    {
      icon: FaBullhorn,
      label: 'Announcements',
      path: '/admin/announcements',
      permission: PERMISSIONS.ANNOUNCEMENT_CREATE,
    },
    {
      icon: FaHistory,
      label: 'Admin Logs',
      path: '/admin/logs',
      permission: PERMISSIONS.LOGS_VIEW,
    },
    {
      icon: FaLock,
      label: 'Permissions Panel',
      path: '/admin/permissions',
      requireSuperAdmin: true,
    },
  ];

  const canAccessItem = (item) => {
    if (!adminSession) return false;
    
    // For Permissions Panel - show if user has full_access
    if (item.requireSuperAdmin) {
      return hasPermission(adminSession.permissions, PERMISSIONS.FULL_ACCESS);
    }
    
    return hasPermission(adminSession.permissions, item.permission);
  };

  if (!adminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-discord-dark border-r border-gray-800 w-64 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <FaTimes className="text-xl" />
          </button>

          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
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

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.filter(canAccessItem).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'hover:bg-white hover:bg-opacity-5 text-gray-300'
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Admin Info & Logout */}
          <div className="p-4 border-t border-gray-800">
            <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-white">{profile?.username}</p>
                  <p className="text-xs text-discord-text truncate">Admin</p>
                </div>
              </div>
              <div className="text-xs text-discord-text">
                <p>Permissions: {adminSession.permissions.includes('full_access') ? 'Full Access' : adminSession.permissions.length}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <div className="bg-discord-dark border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all lg:hidden"
            >
              <FaBars className="text-xl text-white" />
            </button>
            <div className="flex items-center gap-2">
              <FaCrown className="text-red-500" />
              <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
            </div>
            <div></div>
          </div>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
      }
