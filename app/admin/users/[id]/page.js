'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaArrowLeft, FaWallet, FaGem, FaCoins, FaTicketAlt, FaSave, FaUser } from 'react-icons/fa';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    wallet_real: '',
    wallet_gems: '',
    wallet_coins: '',
    wallet_vouchers_20: '',
    wallet_vouchers_30: '',
    wallet_vouchers_50: '',
    achievement_points: '',
    level: '',
  });

  useEffect(() => {
    loadUser();
  }, [params.id]);

  const loadUser = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (data) {
      setUser(data);
      setFormData({
        wallet_real: data.wallet_real.toString(),
        wallet_gems: data.wallet_gems.toString(),
        wallet_coins: data.wallet_coins.toString(),
        wallet_vouchers_20: data.wallet_vouchers_20.toString(),
        wallet_vouchers_30: data.wallet_vouchers_30.toString(),
        wallet_vouchers_50: data.wallet_vouchers_50.toString(),
        achievement_points: data.achievement_points.toString(),
        level: data.level.toString(),
      });
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to update this user\'s currencies? This action will be logged.')) {
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        wallet_real: parseFloat(formData.wallet_real),
        wallet_gems: parseInt(formData.wallet_gems),
        wallet_coins: parseInt(formData.wallet_coins),
        wallet_vouchers_20: parseInt(formData.wallet_vouchers_20),
        wallet_vouchers_30: parseInt(formData.wallet_vouchers_30),
        wallet_vouchers_50: parseInt(formData.wallet_vouchers_50),
        achievement_points: parseInt(formData.achievement_points),
        level: parseInt(formData.level),
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      // Create transaction record for real money changes
      const oldReal = parseFloat(user.wallet_real);
      const newReal = updateData.wallet_real;
      
      if (oldReal !== newReal) {
        const diff = newReal - oldReal;
        await supabase.from('transactions').insert({
          user_id: params.id,
          type: diff > 0 ? 'admin_credit' : 'admin_debit',
          amount: diff,
          currency: 'real',
          status: 'completed',
          description: 'Admin currency adjustment',
        });
      }

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'user_currency_edit', {
        targetUserId: params.id,
        username: user.username,
        changes: updateData,
      });

      alert('User currencies updated successfully!');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-discord-text">User not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <FaArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Edit User Currencies</h1>
            <p className="text-discord-text">Update wallet balances and statistics</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{user.username}</h3>
              <p className="text-discord-text">UID: {user.uid}</p>
              <p className="text-sm text-discord-text">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="bg-discord-dark rounded-xl p-6 border border-gray-800 space-y-6">
          {/* Currencies */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaWallet className="text-green-400" />
              Wallet Currencies
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Real Money (₹)
                </label>
                <input
                  type="number"
                  name="wallet_real"
                  value={formData.wallet_real}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Gems
                </label>
                <input
                  type="number"
                  name="wallet_gems"
                  value={formData.wallet_gems}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Coins
                </label>
                <input
                  type="number"
                  name="wallet_coins"
                  value={formData.wallet_coins}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Achievement Points
                </label>
                <input
                  type="number"
                  name="achievement_points"
                  value={formData.achievement_points}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vouchers */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaTicketAlt className="text-purple-400" />
              Vouchers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  ₹20 Vouchers
                </label>
                <input
                  type="number"
                  name="wallet_vouchers_20"
                  value={formData.wallet_vouchers_20}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  ₹30 Vouchers
                </label>
                <input
                  type="number"
                  name="wallet_vouchers_30"
                  value={formData.wallet_vouchers_30}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  ₹50 Vouchers
                </label>
                <input
                  type="number"
                  name="wallet_vouchers_50"
                  value={formData.wallet_vouchers_50}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Level */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaUser className="text-blue-400" />
              User Stats
            </h3>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Level
              </label>
              <input
                type="number"
                name="level"
                value={formData.level}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-4">
            <p className="text-orange-400 text-sm font-semibold">⚠️ Warning</p>
            <p className="text-discord-text text-sm mt-1">
              Editing currencies directly affects the user's wallet. This action will be logged and visible in admin logs.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <FaSave />
                  Update Currencies
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
                    }
