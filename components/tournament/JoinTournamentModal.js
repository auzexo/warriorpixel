'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FaTimes, FaTrophy, FaMoneyBillWave, FaGamepad } from 'react-icons/fa';

export default function JoinTournamentModal({ tournament, user, profile, onClose, onSuccess }) {
  const [inGameName, setInGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!inGameName.trim()) {
      setError('Please enter your in-game name');
      return;
    }

    if (profile.wallet_real < tournament.entry_fee) {
      setError(`Insufficient balance. You need ₹${tournament.entry_fee} to join.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { count: currentCount } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id);

      if (currentCount >= tournament.max_participants) {
        throw new Error('Tournament is now full');
      }

      const { data: participant, error: joinError } = await supabase
        .from('tournament_participants')
        .insert([{
          tournament_id: tournament.id,
          user_id: user.id,
          in_game_name: inGameName.trim(),
          seat_number: currentCount + 1,
          entry_fee_paid: tournament.entry_fee,
        }])
        .select()
        .single();

      if (joinError) throw joinError;

      const newBalance = parseFloat(profile.wallet_real) - parseFloat(tournament.entry_fee);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_real: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'tournament_entry',
          amount: -parseFloat(tournament.entry_fee),
          currency: 'real',
          description: `Entry fee for ${tournament.title}`,
        }]);

      if (transactionError) throw transactionError;

      alert('Successfully joined tournament!');
      onSuccess();
    } catch (error) {
      console.error('Error joining tournament:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Join Tournament</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-smooth"
          >
            <FaTimes className="text-xl text-white" />
          </button>
        </div>

        {/* Tournament Info */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
              <FaTrophy className="text-2xl text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{tournament.title}</h3>
              <p className="text-sm text-discord-text">{tournament.game}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-green-400" />
              <div>
                <p className="text-xs text-discord-text">Entry Fee</p>
                <p className="font-bold text-white">₹{tournament.entry_fee}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaTrophy className="text-yellow-400" />
              <div>
                <p className="text-xs text-discord-text">Prize Pool</p>
                <p className="font-bold text-white">₹{tournament.prize_pool}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="glass rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-discord-text">Your Balance</span>
            <span className={`font-bold ${
              profile.wallet_real >= tournament.entry_fee ? 'text-green-400' : 'text-red-400'
            }`}>
              ₹{parseFloat(profile.wallet_real || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-discord-text mb-2">
              In-Game Name *
            </label>
            <div className="relative">
              <FaGamepad className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                placeholder="Enter your in-game name"
                className="w-full pl-10 pr-4 py-3 bg-discord-dark border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                required
                maxLength={50}
              />
            </div>
            <p className="text-xs text-discord-text mt-1">
              This will be visible to other players
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white rounded-lg font-bold transition-smooth shadow-lg btn-glow disabled:opacity-50"
          >
            {loading ? 'Joining...' : `Pay ₹${tournament.entry_fee} & Join`}
          </button>
        </form>

        <p className="text-xs text-center text-discord-text mt-4">
          By joining, you agree to the tournament rules and entry fee payment
        </p>
      </div>
    </div>
  );
}
