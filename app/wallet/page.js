'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTransactions } from '@/lib/database';
import { FaWallet, FaCoins, FaGem, FaTicketAlt, FaHistory, FaPlus, FaMinus, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function WalletPage() {
  const { profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [profile]);

  const loadTransactions = async () => {
    if (!profile) return;
    
    setLoading(true);
    const result = await getTransactions(profile.id);
    if (result.success) {
      setTransactions(result.data);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case 'real':
        return '₹';
      case 'gems':
        return '💎';
      case 'coins':
        return '🪙';
      default:
        return '🎫';
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-discord-text">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaWallet />
          My Wallet
        </h1>
        <p className="text-white text-opacity-90">Manage your balance and transactions</p>
      </div>

      {/* Currency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Money */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-green-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <FaWallet className="text-green-400 text-3xl" />
            <span className="text-discord-text text-sm">Real Money</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{(profile.wallet_real || 0).toFixed(2)}</p>
        </div>

        {/* Gems */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-cyan-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <FaGem className="text-cyan-400 text-3xl" />
            <span className="text-discord-text text-sm">Gems</span>
          </div>
          <p className="text-3xl font-bold text-white">{profile.wallet_gems || 0}</p>
        </div>

        {/* Coins */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-yellow-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <FaCoins className="text-yellow-400 text-3xl" />
            <span className="text-discord-text text-sm">Coins</span>
          </div>
          <p className="text-3xl font-bold text-white">{profile.wallet_coins || 0}</p>
        </div>

        {/* Vouchers */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800 hover:border-purple-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <FaTicketAlt className="text-purple-400 text-3xl" />
            <span className="text-discord-text text-sm">Vouchers</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {(profile.wallet_vouchers_20 || 0) + (profile.wallet_vouchers_30 || 0) + (profile.wallet_vouchers_50 || 0)}
          </p>
          <div className="mt-2 flex gap-2 text-xs">
            {profile.wallet_vouchers_20 > 0 && (
              <span className="bg-purple-500 bg-opacity-20 text-purple-400 px-2 py-1 rounded">
                ₹20 × {profile.wallet_vouchers_20}
              </span>
            )}
            {profile.wallet_vouchers_30 > 0 && (
              <span className="bg-purple-500 bg-opacity-20 text-purple-400 px-2 py-1 rounded">
                ₹30 × {profile.wallet_vouchers_30}
              </span>
            )}
            {profile.wallet_vouchers_50 > 0 && (
              <span className="bg-purple-500 bg-opacity-20 text-purple-400 px-2 py-1 rounded">
                ₹50 × {profile.wallet_vouchers_50}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
          <FaPlus />
          Add Money
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
          <FaMinus />
          Withdraw
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-discord-dark rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaHistory />
            Transaction History
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-discord-text">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.amount < 0 ? 'bg-red-500 bg-opacity-20' : 'bg-green-500 bg-opacity-20'}`}>
                      {tx.amount < 0 ? (
                        <FaArrowDown className="text-red-400" />
                      ) : (
                        <FaArrowUp className="text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{tx.description || tx.type}</p>
                      <p className="text-xs text-discord-text">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{getCurrencyIcon(tx.currency)}{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-discord-text capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaHistory className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-discord-text">No transactions yet</p>
              <p className="text-sm text-gray-500 mt-2">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
