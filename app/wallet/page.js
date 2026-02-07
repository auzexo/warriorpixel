'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { FaWallet, FaCoins, FaGem, FaTicketAlt, FaHistory, FaPlus, FaMinus } from 'react-icons/fa';

export default function WalletPage() {
  const { userProfile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [userProfile]);

  const loadTransactions = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaWallet />
          My Wallet
        </h1>
        <p className="text-white text-opacity-90">Manage your balance and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="flex items-center gap-3 mb-2">
            <FaWallet className="text-green-400 text-2xl" />
            <span className="text-gray-400 text-sm">Real Money</span>
          </div>
          <p className="text-3xl font-bold">₹{(userProfile.wallet_real || 0).toFixed(2)}</p>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="flex items-center gap-3 mb-2">
            <FaGem className="text-cyan-400 text-2xl" />
            <span className="text-gray-400 text-sm">Gems</span>
          </div>
          <p className="text-3xl font-bold">{userProfile.wallet_gems || 0}</p>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="flex items-center gap-3 mb-2">
            <FaCoins className="text-yellow-400 text-2xl" />
            <span className="text-gray-400 text-sm">Coins</span>
          </div>
          <p className="text-3xl font-bold">{userProfile.wallet_coins || 0}</p>
        </div>

        <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5">
          <div className="flex items-center gap-3 mb-2">
            <FaTicketAlt className="text-purple-400 text-2xl" />
            <span className="text-gray-400 text-sm">Vouchers</span>
          </div>
          <p className="text-3xl font-bold">
            {(userProfile.wallet_vouchers_20 || 0) + (userProfile.wallet_vouchers_30 || 0) + (userProfile.wallet_vouchers_50 || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all">
          <FaPlus />
          Add Money
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all">
          <FaMinus />
          Withdraw
        </button>
      </div>

      <div className="bg-primary-card rounded-xl border border-white border-opacity-5">
        <div className="p-6 border-b border-white border-opacity-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaHistory />
            Transaction History
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                  <div>
                    <p className="font-semibold">{tx.type}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
