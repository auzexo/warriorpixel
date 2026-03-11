'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FaCrown, FaUser, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    admin_id: '',
    admin_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    const session = localStorage.getItem('admin_session');
    if (session) {
      router.push('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Attempting login for:', credentials.admin_id);

    try {
      // Query admin_accounts table with CORRECT column names
      console.log('📊 Querying admin_accounts...');
      
      const { data: admin, error: adminError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('admin_id', credentials.admin_id)
        .eq('admin_password', credentials.admin_password)
        .eq('is_active', true)
        .maybeSingle();

      console.log('📊 Query result:', { admin, adminError });

      if (adminError) {
        console.error('❌ Database error:', adminError);
        throw new Error(`Database error: ${adminError.message}`);
      }

      if (!admin) {
        console.log('❌ No admin found with these credentials');
        throw new Error('Invalid admin ID or password');
      }

      console.log('✅ Admin found:', admin.admin_id);

      // Create session
      const session = {
        id: admin.id,
        username: admin.admin_id, // Use admin_id as username for compatibility
        admin_id: admin.admin_id,
        permissions: admin.permissions || [],
        loginTime: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('admin_session', JSON.stringify(session));
      console.log('✅ Session created');

      // Log admin login (don't fail login if this fails)
      try {
        await supabase.from('admin_logs').insert({
          admin_id: admin.id,
          action: 'login',
          details: 'Admin logged in',
          ip_address: 'N/A',
          user_agent: navigator.userAgent
        });
        console.log('✅ Login logged');
      } catch (logError) {
        console.error('⚠️ Failed to log admin login:', logError);
        // Don't fail the login if logging fails
      }

      // Redirect to dashboard
      console.log('✅ Redirecting to dashboard');
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-discord-darkest via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-discord-dark border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FaCrown className="text-4xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
            <p className="text-sm text-red-100">WarriorPixel Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
                <p className="text-xs text-red-500 mt-2">Check browser console (F12) for details</p>
              </div>
            )}

            {/* Admin ID */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Admin ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={credentials.admin_id}
                  onChange={(e) => setCredentials({ ...credentials, admin_id: e.target.value })}
                  placeholder="Enter admin ID"
                  className="w-full pl-12 pr-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-all"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  type="password"
                  value={credentials.admin_password}
                  onChange={(e) => setCredentials({ ...credentials, admin_password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full pl-12 pr-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-red-600/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Login
                </>
              )}
            </button>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6">
            <div className="pt-6 border-t border-gray-800">
              <p className="text-xs text-center text-gray-500">
                Admin access only. All actions are logged.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure admin authentication
          </p>
        </div>
      </div>
    </div>
  );
}
