// app/wallet/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions, createWithdrawalRequest } from '@/lib/database';
import { FaWallet, FaPlus, FaArrowUp, FaHistory, FaCoins, FaGem, FaTicketAlt } from 'react-icons/fa';
import { format } from 'date-fns';

export default function WalletPage() {
  const { userProfile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');

  const wallet = {
    real: userProfile?.wallet_real || 0,
    gems: userProfile?.wallet_gems || 0,
    coins: userProfile?.wallet_coins || 0,
    vouchers: (userProfile?.wallet_vouchers_20 || 0) + 
              (userProfile?.wallet_vouchers_30 || 0) + 
              (userProfile?.wallet_vouchers_50 || 0)
  };

  useEffect(() => {
    if (userProfile) {
      loadTransactions();
    }
  }, [userProfile]);

  const loadTransactions = async () => {
    setLoading(true);
    const result = await getTransactions(userProfile.id, 20);
    if (result.success) {
      setTransactions(result.data);
    }
    setLoading(false);
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    alert(`💳 PhonePe integration coming soon!\nYou'll be able to add ₹${amount}`);
    setShowAddMoney(false);
    setAmount('');
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 10 || withdrawAmount > 1800) {
      alert('Amount must be between ₹10 and ₹1800');
      return;
    }

    if (withdrawAmount > wallet.real) {
      alert('Insufficient balance');
      return;
    }

    const result = await createWithdrawalRequest(userProfile.id, withdrawAmount, upiId);
    if (result.success) {
      alert('✅ Withdrawal request submitted!\nProcessing time: Instant via PhonePe');
      setShowWithdraw(false);
      setAmount('');
      setUpiId('');
      refreshProfile();
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaWallet />
          Wallet
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Manage your balance and transactions
        </p>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Real Money */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-opacity-80">Real Money</span>
            <FaWallet className="text-2xl text-white text-opacity-50" />
          </div>
          <div className="text-3xl font-bold mb-4">₹{wallet.real.toFixed(2)}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMoney(true)}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaPlus /> Add
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaArrowUp /> Withdraw
            </button>
          </div>
        </div>

        {/* Gems */}
        <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-opacity-80">Gems</span>
            <FaGem className="text-2xl text-white text-opacity-50" />
          </div>
          <div className="text-3xl font-bold mb-4">{wallet.gems}</div>
          <p className="text-sm text-white text-opacity-70">Buy from shop</p>
        </div>

        {/* Coins */}
        <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-opacity-80">Coins</span>
            <FaCoins className="text-2xl text-white text-opacity-50" />
          </div>
          <div className="text-3xl font-bold mb-4">{wallet.coins}</div>
          <p className="text-sm text-white text-opacity-70">Earn from rewards</p>
        </div>

        {/* Vouchers */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-opacity-80">Vouchers</span>
            <FaTicketAlt className="text-2xl text-white text-opacity-50" />
          </div>
          <div className="text-3xl font-bold mb-4">{wallet.vouchers}</div>
          <p className="text-sm text-white text-opacity-70">Tournament discounts</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-primary-card rounded-xl p-4 md:p-6 border border-white border-opacity-5">
        <div className="flex items-center gap-2 mb-6">
          <FaHistory className="text-blue-500 text-xl" />
          <h2 className="text-xl md:text-2xl font-bold">Transaction History</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white bg-opacity-5 rounded-lg h-16 skeleton"></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white bg-opacity-5 rounded-lg p-4 flex items-center justify-between hover:bg-opacity-10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                  } bg-opacity-20`}>
                    <span className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                      {transaction.amount > 0 ? '+' : '-'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium capitalize">{transaction.transaction_type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-400">
                      {transaction.created_at 
                        ? format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.currency_type === 'real' ? '₹' : ''}{Math.abs(transaction.amount)}
                    {transaction.currency_type === 'gems' && ' 💎'}
                    {transaction.currency_type === 'coins' && ' 🪙'}
                  </p>
                  <p className="text-sm text-gray-400">{transaction.description || 'Transaction'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaHistory className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-card rounded-2xl w-full max-w-md p-6 md:p-8 border border-white border-opacity-10">
            <h3 className="text-2xl font-bold mb-6">Add Money</h3>
            
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum ₹10"
                  className="input"
                  required
                />
              </div>

              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  💳 PhonePe integration coming soon! Zero charges on UPI payments.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoney(false)}
                  className="flex-1 btn-danger py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-card rounded-2xl w-full max-w-md p-6 md:p-8 border border-white border-opacity-10">
            <h3 className="text-2xl font-bold mb-6">Withdraw Money</h3>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (₹10 - ₹1800)</label>
                <input
                  type="number"
                  min="10"
                  max="1800"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Daily limit: ₹1800 | Your balance: ₹{wallet.real.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  className="input"
                  required
                />
              </div>

              <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
                <p className="text-sm text-green-400">
                  ⚡ Instant withdrawal via PhonePe! Money credited in 30 seconds.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 btn-danger py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-success py-3"
                >
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
