'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaArrowLeft, FaGift, FaCoins, FaGem, FaTicketAlt, FaMoneyBillWave } from 'react-icons/fa';

export default function GiveRewardsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [rewardType, setRewardType] = useState('money');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

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
    }

    setLoading(false);
  };

  const handleSendReward = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const confirmation = confirm(
      `Send ${rewardType === 'money' ? '₹' : ''}${amount} ${
        rewardType === 'money' ? 'Real Money' :
        rewardType === 'gems' ? 'Gems' :
        rewardType === 'coins' ? 'Coins' :
        `₹${amount} Vouchers`
      } to ${user.username}?`
    );

    if (!confirmation) return;

    setSending(true);

    try {
      const amountNum = parseFloat(amount);
      let updateData = {};
      let currencyType = '';

      // Determine what to update
      if (rewardType === 'money') {
        updateData.wallet_real = parseFloat(user.wallet_real) + amountNum;
        currencyType = 'real';
      } else if (rewardType === 'gems') {
        updateData.wallet_gems = parseInt(user.wallet_gems) + parseInt(amountNum);
        currencyType = 'gems';
      } else if (rewardType === 'coins') {
        updateData.wallet_coins = parseInt(user.wallet_coins) + parseInt(amountNum);
        currencyType = 'coins';
      } else if (rewardType === 'voucher_20') {
        updateData.wallet_vouchers_20 = parseInt(user.wallet_vouchers_20) + parseInt(amountNum);
        currencyType = 'voucher_20';
      } else if (rewardType === 'voucher_30') {
        updateData.wallet_vouchers_30 = parseInt(user.wallet_vouchers_30) + parseInt(amountNum);
        currencyType = 'voucher_30';
      } else if (rewardType === 'voucher_50') {
        updateData.wallet_vouchers_50 = parseInt(user.wallet_vouchers_50) + parseInt(amountNum);
        currencyType = 'voucher_50';
      }

      // Update user wallet
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: params.id,
        type: 'admin_credit',
        amount: amountNum,
        currency: currencyType,
        status: 'completed',
        description: reason || 'Admin reward',
      });

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'reward_given', {
        targetUserId: params.id,
        username: user.username,
        rewardType: rewardType,
        amount: amountNum,
        reason: reason,
      });

      alert('Reward sent successfully!');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error sending reward:', error);
      alert('Error sending reward: ' + error.message);
    } finally {
      setSending(false);
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <FaArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Give Rewards</h1>
            <p className="text-discord-text">Send rewards to user</p>
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

        {/* Current Balances */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Current Balances</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-discord-text text-sm">Real Money</p>
              <p className="text-green-400 font-bold">₹{parseFloat(user.wallet_real).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-discord-text text-sm">Gems</p>
              <p className="text-cyan-400 font-bold">{user.wallet_gems}</p>
            </div>
            <div>
              <p className="text-discord-text text-sm">Coins</p>
              <p className="text-yellow-400 font-bold">{user.wallet_coins}</p>
            </div>
            <div>
              <p className="text-discord-text text-sm">Vouchers</p>
              <p className="text-purple-400 font-bold">
                {user.wallet_vouchers_20 + user.wallet_vouchers_30 + user.wallet_vouchers_50}
              </p>
            </div>
          </div>
        </div>

        {/* Reward Form */}
        <form onSubmit={handleSendReward} className="bg-discord-dark rounded-xl p-6 border border-gray-800 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FaGift className="text-purple-400" />
            Send Reward
          </h3>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              Reward Type
            </label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="money">Real Money (₹)</option>
              <option value="gems">Gems</option>
              <option value="coins">Coins</option>
              <option value="voucher_20">₹20 Vouchers</option>
              <option value="voucher_30">₹30 Vouchers</option>
              <option value="voucher_50">₹50 Vouchers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step={rewardType === 'money' ? '0.01' : '1'}
              min="0"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Tournament winner reward, Event participation, etc."
              rows="3"
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>

          <div className="bg-purple-500 bg-opacity-10 border border-purple-500 rounded-lg p-4">
            <p className="text-purple-400 text-sm font-semibold">ℹ️ Note</p>
            <p className="text-discord-text text-sm mt-1">
              This reward will be added to the user's wallet immediately and logged in admin actions.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <FaGift />
                  Send Reward
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
        }
