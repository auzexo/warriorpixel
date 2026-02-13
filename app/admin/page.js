'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { verifyAdminCredentials } from '@/lib/admin';
import { FaCrown, FaLock, FaUser, FaExclamationTriangle } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is even marked as admin
  if (!profile?.is_admin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-discord-text">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyAdminCredentials(adminId, adminPassword);

    if (result.success) {
      // Store admin session in localStorage
      localStorage.setItem('admin_session', JSON.stringify({
        adminAccountId: result.adminAccount.admin_account_id,
        permissions: result.adminAccount.permissions,
        loginTime: new Date().toISOString(),
      }));

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid admin credentials');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-discord-dark rounded-xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCrown className="text-white text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-discord-text">Enter your admin credentials to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm flex items-center gap-2">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                <FaUser className="inline mr-2" />
                Admin ID
              </label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter your admin ID"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                <FaLock className="inline mr-2" />
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-lg">
            <p className="text-xs text-discord-text">
              <FaLock className="inline mr-1" />
              Logged in as: <span className="text-white font-semibold">{profile.username}</span>
            </p>
            <p className="text-xs text-discord-text mt-1">
              UID: <span className="text-purple-400">{profile.uid}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
    }
