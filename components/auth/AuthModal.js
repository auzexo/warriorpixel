'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FaGoogle, FaDiscord, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

export default function AuthModal({ onClose, canClose = false }) {
  const { login, signup, signInWithGoogle, signInWithDiscord } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await signup(formData.email, formData.password, formData.firstName);

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setLoading(true);
    const result = await signInWithDiscord();
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-discord-darkest flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="bg-discord-dark rounded-lg p-8 shadow-2xl relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-discord-text hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </h2>
            <p className="text-discord-text text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                    }}
                    className="text-[#00a8fc] hover:underline"
                    disabled={loading}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                "We're excited to have you!"
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-discord-text text-xs font-semibold mb-2 uppercase tracking-wide">
                    First name
                  </label>
                  <input
                    type="text"
                    placeholder="Fletcher"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-discord-input border-none rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-discord-purple"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-discord-text text-xs font-semibold mb-2 uppercase tracking-wide">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-discord-input border-none rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-discord-purple"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-discord-text text-xs font-semibold mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-discord-input border-none rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-discord-purple"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-discord-text text-xs font-semibold mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-discord-input border-none rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-discord-purple pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-discord-text hover:text-white transition-colors"
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
                  className="mt-1 w-4 h-4 bg-discord-input border-none rounded"
                  required
                />
                <label htmlFor="terms" className="text-xs text-discord-text leading-tight">
                  I agree to the{' '}
                  <a href="#" className="text-[#00a8fc] hover:underline">
                    Terms & Conditions
                  </a>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-discord-purple hover:bg-discord-purple-dark text-white py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-discord-dark text-gray-500 text-xs">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-discord-input hover:bg-discord-darker text-white rounded border border-gray-700 transition-colors disabled:opacity-50"
            >
              <FaGoogle className="text-base" />
              <span className="text-sm font-medium">Google</span>
            </button>

            <button
              onClick={handleDiscordLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-discord-purple hover:bg-discord-purple-dark text-white rounded transition-colors disabled:opacity-50"
            >
              <FaDiscord className="text-base" />
              <span className="text-sm font-medium">Discord</span>
            </button>
          </div>

          {/* Toggle Login/Signup */}
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
}
