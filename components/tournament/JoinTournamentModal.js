'use client';

import { useState } from 'react';
import { FaTimes, FaUser, FaTicketAlt, FaExclamationTriangle } from 'react-icons/fa';

export default function JoinTournamentModal({ tournament, userProfile, onJoin, onClose, loading }) {
  const [inGameName, setInGameName] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [error, setError] = useState('');

  const availableVouchers = [];
  
  if (userProfile?.wallet_vouchers_20 > 0 && tournament?.entry_fee === 20) {
    availableVouchers.push({ type: '20', count: userProfile.wallet_vouchers_20 });
  }
  
  if (userProfile?.wallet_vouchers_30 > 0 && tournament?.entry_fee === 30) {
    availableVouchers.push({ type: '30', count: userProfile.wallet_vouchers_30 });
  }
  
  if (userProfile?.wallet_vouchers_50 > 0 && tournament?.entry_fee === 50) {
    availableVouchers.push({ type: '50', count: userProfile.wallet_vouchers_50 });
  }

  const finalFee = selectedVoucher ? 0 : (tournament?.entry_fee || 0);
  const hasEnoughBalance = (userProfile?.wallet_real || 0) >= finalFee;
  const seatsAvailable = (tournament?.max_participants || 0) - (tournament?.participants_count || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inGameName.trim()) {
      setError('Please enter your in-game name');
      return;
    }

    if (inGameName.trim().length < 3) {
      setError('In-game name must be at least 3 characters');
      return;
    }

    if (finalFee > 0 && !hasEnoughBalance) {
      setError('Insufficient balance');
      return;
    }

    if (seatsAvailable <= 0) {
      setError('Tournament is full');
      return;
    }

    onJoin(inGameName.trim(), selectedVoucher);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-xl w-full max-w-md p-6 border border-gray-800 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-discord-text hover:text-white transition-colors"
          disabled={loading}
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-white">Join Tournament</h2>
        <p className="text-discord-text text-sm mb-6">{tournament?.name}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
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
              className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
              required
              maxLength={50}
              disabled={loading}
            />
          </div>

          {availableVouchers.length > 0 && tournament?.entry_fee > 0 && (
            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                <FaTicketAlt className="inline mr-2" />
                Use Voucher (Optional)
              </label>
              <select
                value={selectedVoucher || ''}
                onChange={(e) => {
                  setSelectedVoucher(e.target.value || null);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                disabled={loading}
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
              <span className="text-discord-text">Entry Fee:</span>
              <span className={finalFee === 0 ? 'text-green-400 font-bold' : 'text-white font-semibold'}>
                {finalFee === 0 ? 'FREE (Voucher)' : `₹${finalFee}`}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-discord-text">Seats Available:</span>
              <span className={seatsAvailable > 10 ? 'text-green-400' : seatsAvailable > 0 ? 'text-orange-400' : 'text-red-400'}>
                {seatsAvailable}/{tournament?.max_participants || 0}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-discord-text">Your Balance:</span>
              <span className="text-white font-semibold">₹{(userProfile?.wallet_real || 0).toFixed(2)}</span>
            </div>

            {finalFee > 0 && !hasEnoughBalance && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <FaExclamationTriangle />
                  Insufficient balance! Add ₹{(finalFee - (userProfile?.wallet_real || 0)).toFixed(2)} more
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              disabled={loading}
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
}
