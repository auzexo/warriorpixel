// components/AuthModal.js
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle, FaDiscord, FaEnvelope, FaLock, FaUser, FaTimes } from 'react-icons/fa';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, loginWithDiscord } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error || 'Login failed');
        }
      } else {
        if (!formData.username.trim()) {
          setError('Please enter a username');
          setLoading(false);
          return;
        }
        const result = await signup(formData.email, formData.password, formData.username);
        if (!result.success) {
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('An error occurred');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Google login failed');
    }
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithDiscord();
    if (!result.success) {
      setError(result.error || 'Discord login failed');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-primary-card rounded-2xl w-full max-w-md p-6 md:p-8 border border-white border-opacity-10 relative animate-scale-in">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            {isLogin ? 'Welcome Back' : 'Join WarriorPixel'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Login to continue' : 'Create account to get started'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 bg-white bg-opacity-5 rounded-lg p-1">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
              isLogin ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
              !isLogin ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <FaUser /> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose username"
                className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <FaLock /> Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-base md:text-lg font-semibold disabled:opacity-50 transition-all"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white border-opacity-10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-primary-card text-gray-400">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <FaGoogle />
            Continue with Google
          </button>

          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <FaDiscord />
            Continue with Discord
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-purple-400 hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
