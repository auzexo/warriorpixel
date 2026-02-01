// components/Sidebar.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FaHome, 
  FaFire, 
  FaCube, 
  FaGamepad, 
  FaWallet, 
  FaShoppingCart,
  FaInfoCircle,
  FaSignOutAlt,
  FaShieldAlt,
  FaCrown,
  FaDownload
} from 'react-icons/fa';

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/', icon: FaHome },
    { name: 'Tournaments', href: '/tournaments', icon: FaGamepad },
    { name: 'Free Fire', href: '/freefire', icon: FaFire, color: '#3b82f6' },
    { name: 'Minecraft', href: '/minecraft', icon: FaCube, color: '#10b981' },
    { name: 'Shop', href: '/shop', icon: FaShoppingCart },
    { name: 'Wallet', href: '/wallet', icon: FaWallet },
    { name: 'Download App', href: '/download', icon: FaDownload, mobileOnly: true },
  ];

  const adminNav = { name: 'Admin Panel', href: '/admin', icon: FaCrown, color: '#ff4d4d' };
  const infoNav = { name: 'Info & Help', href: '/info', icon: FaInfoCircle };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-primary-darker border-r border-white border-opacity-5
        transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-white border-opacity-5">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-3xl text-purple-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              WARRIORPIXEL
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-white bg-opacity-10 text-white border-l-4' 
                      : 'text-gray-400 hover:bg-white hover:bg-opacity-5 hover:text-white'
                    }
                  `}
                  style={isActive && item.color ? { borderLeftColor: item.color } : {}}
                >
                  <Icon className="text-lg" style={item.color ? { color: item.color } : {}} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="my-4 border-t border-white border-opacity-5" />

          {(() => {
            console.log('User Profile:', userProfile);
            console.log('Is Admin:', userProfile?.is_admin);
            return userProfile?.is_admin;
          })() && (
            <Link
              href={adminNav.href}
              onClick={() => onClose()}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2
                ${pathname === adminNav.href 
                  ? 'bg-white bg-opacity-10 text-white border-l-4' 
                  : 'text-gray-400 hover:bg-white hover:bg-opacity-5 hover:text-white'
                }
              `}
              style={pathname === adminNav.href ? { borderLeftColor: adminNav.color } : {}}
            >
              <adminNav.icon className="text-lg" style={{ color: adminNav.color }} />
              <span className="font-medium">{adminNav.name}</span>
            </Link>
          )}

          <Link
            href={infoNav.href}
            onClick={() => onClose()}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${pathname === infoNav.href 
                ? 'bg-white bg-opacity-10 text-white' 
                : 'text-gray-400 hover:bg-white hover:bg-opacity-5 hover:text-white'
              }
            `}
          >
            <infoNav.icon className="text-lg" />
            <span className="font-medium">{infoNav.name}</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white border-opacity-5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full
                     text-gray-400 hover:bg-red-500 hover:bg-opacity-10 hover:text-red-500"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-white text-2xl hover:text-red-500"
        >
          ×
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
