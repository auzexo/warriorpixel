// components/JoinTournamentModal.js
'use client';

import { useState } from 'react';
import { FaTimes, FaGamepad, FaTicketAlt, FaUser } from 'react-icons/fa';

const JoinTournamentModal = ({ 
  tournament, 
  userProfile, 
  onJoin, 
  onClose, 
  loading 
}) => {
  const [inGameName, setInGameName] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [error, setError] = useState('');

  const availableVouchers = [];
  if (userProfile?.wallet_vouchers_20 > 0 && tournament.entry_fee === 20) {
    availableVouchers.push({ type: '20', count: userProfile.wallet_vouchers_20 });
  }
  if (userProfile?.wallet_vouchers_30 > 0 && tournament.entry_fee === 30) {
    availableVouchers.push({ type: '30', count: userProfile.wallet_vouchers_30 });
  }
  if (userProfile?.wallet_vouchers_50 > 0 && tournament.entry_fee === 50) {
    availableVouchers.push({ type: '50', count: userProfile.wallet_vouchers_50 });
  }

  const finalFee = selectedVoucher ? 0 : tournament.entry_fee;
  const hasEnoughBalance = (userProfile?.wallet_real || 0) >= finalFee;
  const seatsAvailable = tournament.max_participants - (tournament.participants_count || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inGameName.trim()) {
      setError('Please enter your in-game name');
      return;
    }

    if (finalFee > 0 && !hasEnoughBalance) {
      setError('Insufficient balance');
      return;
    }

    onJoin(inGameName.trim(), selectedVoucher);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-primary-card rounded-2xl w-full max-w-md p-6 md:p-8 border border-white border-opacity-10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FaGamepad className="text-purple-500" />
          Join Tournament
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <FaUser className="inline mr-2" />
              In-Game Name (IGN) *
            </label>
            <input
              type="text"
              value={inGameName}
              onChange={(e) => {
                setInGameName(e.target.value);
                setError('');
              }}
              placeholder="Enter your in-game name"
              className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be used for match verification
            </p>
          </div>

          {availableVouchers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <FaTicketAlt className="inline mr-2" />
                Use Voucher (Optional)
              </label>
              <select
                value={selectedVoucher || ''}
                onChange={(e) => setSelectedVoucher(e.target.value || null)}
                className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Pay ₹{tournament.entry_fee}</option>
                {availableVouchers.map(v => (
                  <option key={v.type} value={v.type}>
                    Use ₹{v.type} Voucher (FREE) - {v.count} available
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white bg-opacity-5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Entry Fee:</span>
              <span className={finalFee === 0 ? 'text-green-400 font-bold' : 'text-white'}>
                {finalFee === 0 ? 'FREE (Voucher)' : `₹${finalFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Seats Available:</span>
              <span className={seatsAvailable > 10 ? 'text-green-400' : 'text-orange-400'}>
                {seatsAvailable}/{tournament.max_participants}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your Balance:</span>
              <span className="text-white">₹{(userProfile?.wallet_real || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (finalFee > 0 && !hasEnoughBalance) || seatsAvailable === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
