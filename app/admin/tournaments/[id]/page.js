'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa';

export default function TournamentParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id;

  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPaid: 0,
    balance: 0,
  });

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    setLoading(true);

    try {
      // Load tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Load participants with user data
      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          users (
            username,
            email,
            uid
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('seat_number', { ascending: true });

      if (participantsError) throw participantsError;

      setParticipants(participantsData || []);

      // Calculate stats
      const collected = (participantsData || []).reduce((sum, p) => sum + (parseFloat(p.entry_fee_paid) || 0), 0);
      const paid = (participantsData || []).reduce((sum, p) => sum + (parseFloat(p.money_received) || 0), 0);
      
      setStats({
        totalCollected: collected,
        totalPaid: paid,
        balance: collected - paid,
      });
    } catch (error) {
      console.error('Error loading tournament data:', error);
      alert('Error loading tournament data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMoney = async (participantId, username) => {
    const amount = prompt(`Enter amount to send to ${username}:`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');

    try {
      const participant = participants.find(p => p.id === participantId);
      
      // Update participant money received
      const newAmount = (parseFloat(participant.money_received) || 0) + parseFloat(amount);
      await supabase
        .from('tournament_participants')
        .update({ money_received: newAmount })
        .eq('id', participantId);

      // Update user wallet
      await supabase
        .from('users')
        .update({ 
          wallet_real: supabase.raw(`wallet_real + ${parseFloat(amount)}`)
        })
        .eq('id', participant.user_id);

      // Create transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: participant.user_id,
          type: 'tournament_reward',
          amount: parseFloat(amount),
          currency: 'real',
          description: `Prize from tournament: ${tournament.title}`,
        }]);

      // Log action
      await logAdminAction(adminSession.adminAccountId, 'money_sent', {
        targetUserId: participant.user_id,
        targetTournamentId: tournamentId,
        amount: parseFloat(amount),
        username: username,
      });

      alert('Money sent successfully!');
      loadTournamentData();
    } catch (error) {
      console.error('Error sending money:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleTakeMoney = async (participantId, username) => {
    const amount = prompt(`Enter amount to take back from ${username}:`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');

    try {
      const participant = participants.find(p => p.id === participantId);
      
      // Check if enough money to take back
      if ((parseFloat(participant.money_received) || 0) < parseFloat(amount)) {
        alert('Cannot take back more than what was received');
        return;
      }

      // Update participant money received
      const newAmount = (parseFloat(participant.money_received) || 0) - parseFloat(amount);
      await supabase
        .from('tournament_participants')
        .update({ money_received: newAmount })
        .eq('id', participantId);

      // Update user wallet
      await supabase
        .from('users')
        .update({ 
          wallet_real: supabase.raw(`wallet_real - ${parseFloat(amount)}`)
        })
        .eq('id', participant.user_id);

      // Log action
      await logAdminAction(adminSession.adminAccountId, 'money_taken', {
        targetUserId: participant.user_id,
        targetTournamentId: tournamentId,
        amount: parseFloat(amount),
        username: username,
      });

      alert('Money taken back successfully!');
      loadTournamentData();
    } catch (error) {
      console.error('Error taking money:', error);
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-discord-text mt-4">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-500">Tournament not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-all"
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <FaTrophy className="text-red-500" />
            {tournament.title}
          </h1>
          <p className="text-discord-text">Participant Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-2xl text-purple-400" />
              <p className="text-sm text-discord-text">Total Participants</p>
            </div>
            <p className="text-3xl font-bold text-white">{participants.length}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaMoneyBillWave className="text-2xl text-green-400" />
              <p className="text-sm text-discord-text">Total Collected</p>
            </div>
            <p className="text-3xl font-bold text-white">₹{stats.totalCollected.toFixed(2)}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaMoneyBillWave className="text-2xl text-blue-400" />
              <p className="text-sm text-discord-text">Total Paid</p>
            </div>
            <p className="text-3xl font-bold text-white">₹{stats.totalPaid.toFixed(2)}</p>
          </div>

          <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <FaMoneyBillWave className="text-2xl text-yellow-400" />
              <p className="text-sm text-discord-text">Balance</p>
            </div>
            <p className="text-3xl font-bold text-white">₹{stats.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Participants</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-5">
                <tr>
                  <th className="text-left p-4 text-discord-text font-semibold">Seat</th>
                  <th className="text-left p-4 text-discord-text font-semibold">User</th>
                  <th className="text-left p-4 text-discord-text font-semibold">In-Game Name</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Entry Fee</th>
                  <th className="text-left p-4 text-discord-text font-semibold">Money Received</th>
                  <th className="text-right p-4 text-discord-text font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((participant) => (
                    <tr key={participant.id} className="border-t border-gray-800 hover:bg-white hover:bg-opacity-5">
                      <td className="p-4">
                        <span className="font-bold text-purple-400">#{participant.seat_number}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-white">
                            {participant.users?.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-discord-text">
                            {participant.users?.uid || 'No UID'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white">{participant.in_game_name || 'Not set'}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-semibold">
                          ₹{parseFloat(participant.entry_fee_paid || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-blue-400 font-semibold">
                          ₹{parseFloat(participant.money_received || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendMoney(participant.id, participant.users?.username || 'user')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all"
                          >
                            Send Money
                          </button>
                          <button
                            onClick={() => handleTakeMoney(participant.id, participant.users?.username || 'user')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all"
                          >
                            Take Back
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-discord-text">
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
