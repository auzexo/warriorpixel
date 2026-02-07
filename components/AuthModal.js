'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaDiscord, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthModal = ({ onClose }) => {
  const { login, signup, signInWithGoogle, signInWithDiscord } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin 
        ? await login(formData.email, formData.password)
        : await signup(formData.email, formData.password, formData.username);

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
    <div className="fixed inset-0 bg-[#1e1f22] flex items-center justify-center z-50 p-4">
      <div className="bg-[#313338] rounded-lg w-full max-w-md p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome back!' : 'Create an account'}
          </h2>
          <p className="text-[#b5bac1] text-sm">
            {isLogin ? 'Login to continue your gaming journey' : "We're excited to have you!"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-[#f23f42] bg-opacity-10 border border-[#f23f42] rounded text-[#f23f42] text-sm">
            {error}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
          {!isLogin && (
            <div>
              <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00a8fc]"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">
              Email {!isLogin && <span className="text-[#f23f42]">*</span>}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00a8fc]"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">
              Password {!isLogin && <span className="text-[#f23f42]">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#1e1f22] border-none rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00a8fc]"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Continue'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3f4147]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-[#313338] text-[#949ba4] text-xs uppercase">Or continue with</span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded font-medium transition-colors disabled:opacity-50"
          >
            <FaGoogle className="text-lg" />
            <span>Google</span>
          </button>

          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded font-medium transition-colors disabled:opacity-50"
          >
            <FaDiscord className="text-lg" />
            <span>Discord</span>
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-4 text-center text-sm">
          <span className="text-[#949ba4]">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[#00a8fc] hover:underline font-medium"
            disabled={loading}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
