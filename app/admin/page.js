'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaLock, FaUser, FaKey, FaShieldAlt } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && profile && !profile.is_admin) {
      setError('Access Denied: You do not have admin privileges');
    }
  }, [profile, authLoading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting admin login...', { adminId });

      // Direct database query to verify credentials
      const { data: adminAccount, error: queryError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('admin_id', adminId)
        .eq('admin_password', adminPassword)
        .eq('is_active', true)
        .single();

      console.log('Query result:', { adminAccount, queryError });

      if (queryError || !adminAccount) {
        setError('Invalid Admin ID or Password');
        setLoading(false);
        return;
      }

      // Update last login
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminAccount.id);

      // Store admin session in localStorage
      const adminSession = {
        adminAccountId: adminAccount.id,
        permissions: adminAccount.permissions,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem('admin_session', JSON.stringify(adminSession));

      console.log('Admin session created:', adminSession);

      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-discord-dark rounded-xl p-8 border border-red-500">
          <div className="text-center">
            <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-discord-text mb-6">
              You do not have administrator privileges.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-discord-dark rounded-xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-white text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-discord-text">Enter your admin credentials</p>
          </div>

          {/* Current User Info */}
          <div className="mb-6 p-4 bg-white bg-opacity-5 rounded-lg">
            <p className="text-sm text-discord-text">Logged in as:</p>
            <p className="font-semibold text-white">{profile.username}</p>
            <p className="text-xs text-discord-text">{profile.uid}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
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
                placeholder="Enter admin ID"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                <FaKey className="inline mr-2" />
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
                disabled={loading}
                autoComplete="off"
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
          <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <p className="text-blue-400 text-xs font-semibold">🔒 Secure Access</p>
            <p className="text-discord-text text-xs mt-1">
              This panel requires separate admin authentication. All actions are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
      }
