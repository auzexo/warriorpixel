'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaDiscord, FaEye, FaEyeSlash, FaApple } from 'react-icons/fa';

const AuthModal = ({ onClose }) => {
  const { login, signup, signInWithGoogle, signInWithDiscord } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    firstName: '',
    lastName: ''
  });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin 
        ? await login(formData.email, formData.password)
        : await signup(formData.email, formData.password, formData.firstName || 'User');

      if (!result.success) {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) setError(result.error || 'Google login failed');
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    setLoading(true);
    const result = await signInWithDiscord();
    if (!result.success) setError(result.error || 'Discord login failed');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#313338] flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#313338] rounded-lg p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </h2>
            {isLogin && (
              <p className="text-[#b5bac1] text-sm">
                Already have an account?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-[#00a8fc] hover:underline"
                  disabled={loading}
                >
                  Log in
                </button>
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-[#f23f42] bg-opacity-10 border border-[#f23f42] rounded text-[#f23f42] text-sm">
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase tracking-wide">First name</label>
                  <input
                    type="text"
                    placeholder="Fletcher"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm placeholder-[#5c5e66] focus:outline-none"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase tracking-wide">Last name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm placeholder-[#5c5e66] focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm placeholder-[#5c5e66] focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm placeholder-[#5c5e66] focus:outline-none pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-white"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 bg-[#1e1f22] border-none rounded"
                  required
                />
                <label htmlFor="terms" className="text-xs text-[#b5bac1] leading-tight">
                  I agree to the{' '}
                  <a href="#" className="text-[#00a8fc] hover:underline">Terms & Conditions</a>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3f4147]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#313338] text-[#949ba4] text-xs">Or register with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1f22] hover:bg-[#2b2d31] text-white rounded border border-[#1e1f22] transition-colors disabled:opacity-50"
            >
              <FaGoogle className="text-base" />
              <span className="text-sm font-medium">Google</span>
            </button>

            <button
              disabled={true}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1f22] text-white rounded border border-[#1e1f22] opacity-50 cursor-not-allowed"
            >
              <FaApple className="text-base" />
              <span className="text-sm font-medium">Apple</span>
            </button>
          </div>

          {/* Toggle */}
          {!isLogin && (
            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className="text-[#00a8fc] hover:underline text-sm font-medium"
                disabled={loading}
              >
                Already have an account? Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
