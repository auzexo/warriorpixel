'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaArrowLeft, FaUsers, FaCoins, FaMoneyBillWave, FaUndo, FaTrophy, FaEdit } from 'react-icons/fa';

export default function TournamentParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPaid: 0,
    balance: 0,
  });
  const [sendingMoney, setSendingMoney] = useState({});

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);

    // Load tournament
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single();

    // Load participants
    const { data: participantsData } = await supabase
      .from('tournament_participants')
      .select('*, users(username, email, uid)')
      .eq('tournament_id', params.id)
      .order('seat_number', { ascending: true });

    if (tournamentData) {
      setTournament(tournamentData);
    }

    if (participantsData) {
      setParticipants(participantsData);

      // Calculate stats
      const totalCollected = participantsData.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
      const totalPaid = participantsData.reduce((sum, p) => sum + parseFloat(p.prize_won || 0), 0);
      
      setStats({
        totalCollected,
        totalPaid,
        balance: totalCollected - totalPaid,
      });
    }

    setLoading(false);
  };

  const handleSendMoney = async (participantId, userId, currentPrize) => {
    const amount = prompt('Enter amount to send (₹):', '0');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

    const amountNum = parseFloat(amount);
    const confirmation = confirm(`Send ₹${amountNum} to this participant?`);
    if (!confirmation) return;

    setSendingMoney({ ...sendingMoney, [participantId]: true });

    try {
      // Get user's current balance
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_real')
        .eq('id', userId)
        .single();

      if (!userData) throw new Error('User not found');

      // Update user's wallet
      const newBalance = parseFloat(userData.wallet_real) + amountNum;
      const { error: walletError } = await supabase
        .from('users')
        .update({ wallet_real: newBalance })
        .eq('id', userId);

      if (walletError) throw walletError;

      // Update participant's prize_won
      const newPrizeWon = parseFloat(currentPrize || 0) + amountNum;
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .update({ 
          prize_won: newPrizeWon,
          win_tag_given: true 
        })
        .eq('id', participantId);

      if (participantError) throw participantError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'tournament_win',
        amount: amountNum,
        currency: 'real',
        status: 'completed',
        description: `Prize from tournament: ${tournament.name}`,
        reference_id: params.id,
      });

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'money_sent', {
        targetUserId: userId,
        targetTournamentId: params.id,
        amount: amountNum,
        tournamentName: tournament.name,
      });

      alert(`Successfully sent ₹${amountNum} to participant!`);
      loadData();
    } catch (error) {
      console.error('Error sending money:', error);
      alert('Error sending money: ' + error.message);
    } finally {
      setSendingMoney({ ...sendingMoney, [participantId]: false });
    }
  };

  const handleTakeMoney = async (participantId, userId, currentPrize) => {
    if (!currentPrize || parseFloat(currentPrize) <= 0) {
      alert('No prize amount to take back');
      return;
    }

    const amount = prompt('Enter amount to take back (₹):', currentPrize.toString());
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

    const amountNum = parseFloat(amount);
    
    if (amountNum > parseFloat(currentPrize)) {
      alert('Cannot take back more than the prize amount');
      return;
    }

    const confirmation = confirm(`Take back ₹${amountNum} from this participant?`);
    if (!confirmation) return;

    setSendingMoney({ ...sendingMoney, [participantId]: true });

    try {
      // Get user's current balance
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_real')
        .eq('id', userId)
        .single();

      if (!userData) throw new Error('User not found');

      // Check if user has enough balance
      if (parseFloat(userData.wallet_real) < amountNum) {
        throw new Error('User does not have enough balance');
      }

      // Update user's wallet (deduct)
      const newBalance = parseFloat(userData.wallet_real) - amountNum;
      const { error: walletError } = await supabase
        .from('users')
        .update({ wallet_real: newBalance })
        .eq('id', userId);

      if (walletError) throw walletError;

      // Update participant's prize_won
      const newPrizeWon = parseFloat(currentPrize) - amountNum;
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .update({ prize_won: newPrizeWon })
        .eq('id', participantId);

      if (participantError) throw participantError;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'admin_debit',
        amount: -amountNum,
        currency: 'real',
        status: 'completed',
        description: `Money taken back from tournament: ${tournament.name}`,
        reference_id: params.id,
      });

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'money_taken', {
        targetUserId: userId,
        targetTournamentId: params.id,
        amount: amountNum,
        tournamentName: tournament.name,
      });

      alert(`Successfully took back ₹${amountNum} from participant!`);
      loadData();
    } catch (error) {
      console.error('Error taking money:', error);
      alert('Error taking money: ' + error.message);
    } finally {
      setSendingMoney({ ...sendingMoney, [participantId]: false });
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

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-discord-text">Tournament not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
            >
              <FaArrowLeft className="text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{tournament.name}</h1>
              <p className="text-discord-text">Manage tournament participants</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/admin/tournaments/edit/${params.id}`)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            <FaEdit />
            Edit Tournament
          </button>
        </div>

        {/* Tournament Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Prize Pool</p>
            <p className="text-2xl font-bold text-yellow-400">₹{tournament.prize_pool}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Entry Fee</p>
            <p className="text-2xl font-bold text-white">
              {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
            </p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Participants</p>
            <p className="text-2xl font-bold text-white">
              {tournament.participants_count}/{tournament.max_participants}
            </p>
          </div>
          <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
            <p className="text-discord-text text-sm mb-1">Status</p>
            <p className={`text-xl font-bold ${
              tournament.status === 'live' ? 'text-red-400' :
              tournament.status === 'upcoming' ? 'text-blue-400' : 'text-gray-400'
            }`}>
              {tournament.status.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Money Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark rounded-xl p-6 border border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <FaCoins className="text-green-400 text-2xl" />
              <p className="text-discord-text">Total Collected</p>
            </div>
            <p className="text-3xl font-bold text-green-400">₹{stats.totalCollected.toFixed(2)}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-6 border border-red-500">
            <div className="flex items-center gap-3 mb-2">
              <FaMoneyBillWave className="text-red-400 text-2xl" />
              <p className="text-discord-text">Total Paid</p>
            </div>
            <p className="text-3xl font-bold text-red-400">₹{stats.totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-discord-dark rounded-xl p-6 border border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <FaTrophy className="text-blue-400 text-2xl" />
              <p className="text-discord-text">Balance</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">₹{stats.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-discord-dark rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaUsers />
              Participants ({participants.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-5">
                <tr>
                  <th className="text-left p-4 text-discord-text font-semibold">Seat #</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Player</th>
                  <th className="text-left p-4 text-discord-text font-semibold">In-Game Name</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Entry Paid</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Prize Won</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Payment</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Joined At</th>
                  <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((participant) => (
                    <tr key={participant.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                      <td className="p-4">
                        <span className="text-white font-bold text-lg">#{participant.seat_number}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-white">{participant.users.username}</p>
                          <p className="text-xs text-discord-text">{participant.users.uid}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-mono">{participant.in_game_name}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-semibold">
                          {participant.payment_amount === 0 ? 'FREE' : `₹${participant.payment_amount}`}
                        </span>
                        {participant.voucher_used && (
                          <span className="ml-2 text-xs text-purple-400">(Voucher)</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-yellow-400 font-bold">
                          ₹{parseFloat(participant.prize_won || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        {participant.payment_verified ? (
                          <span className="text-green-400 text-sm">✓ Verified</span>
                        ) : (
                          <span className="text-red-400 text-sm">✗ Pending</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-discord-text">
                          {new Date(participant.joined_at).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendMoney(
                              participant.id,
                              participant.user_id,
                              participant.prize_won
                            )}
                            disabled={sendingMoney[participant.id]}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all disabled:opacity-50"
                            title="Send Money"
                          >
                            <FaMoneyBillWave />
                          </button>
                          <button
                            onClick={() => handleTakeMoney(
                              participant.id,
                              participant.user_id,
                              participant.prize_won
                            )}
                            disabled={sendingMoney[participant.id] || !participant.prize_won || parseFloat(participant.prize_won) <= 0}
                            className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all disabled:opacity-50"
                            title="Take Back Money"
                          >
                            <FaUndo />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-discord-text">
                      No participants yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
        }
