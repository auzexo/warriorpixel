'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaCrown, FaMedal, FaAward, FaCheckCircle, FaSkull, FaArrowLeft } from 'react-icons/fa';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booyahWinner, setBooyahWinner] = useState(null);
  const [killCounts, setKillCounts] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTournamentDetails();
  }, [params.id]);

  const loadTournamentDetails = async () => {
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (tournamentError) throw tournamentError;

      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          users (
            id,
            username,
            email,
            wallet_real,
            total_wins,
            total_games
          )
        `)
        .eq('tournament_id', params.id)
        .order('created_at', { ascending: true });

      if (participantsError) throw participantsError;

      setTournament(tournamentData);
      setParticipants(participantsData || []);

      // Initialize kill counts
      const initialKills = {};
      participantsData?.forEach(p => {
        initialKills[p.id] = p.kills || 0;
      });
      setKillCounts(initialKills);

      // Set existing booyah winner if already set
      const existingWinner = participantsData?.find(p => p.got_booyah);
      if (existingWinner) {
        setBooyahWinner(existingWinner.id);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      alert('Error loading tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleKillChange = (participantId, kills) => {
    const killValue = parseInt(kills) || 0;
    setKillCounts(prev => ({
      ...prev,
      [participantId]: killValue
    }));
  };

  const distributePrizes = async () => {
    if (!booyahWinner) {
      alert('Please select the Booyah winner (Win Tag)');
      return;
    }

    if (!confirm('Are you sure you want to distribute prizes? This action cannot be undone.')) {
      return;
    }

    setProcessing(true);

    try {
      const entryFee = parseFloat(tournament.entry_fee) || 0;
      const perKillReward = 7; // Default for now, will come from preset later
      const booyahReward = 5; // Default for now

      // Process each participant
      for (const participant of participants) {
        const kills = killCounts[participant.id] || 0;
        const isBooyahWinner = participant.id === booyahWinner;

        // Calculate rewards
        const killReward = kills * perKillReward;
        const booyahPrize = isBooyahWinner ? booyahReward : 0;
        const totalPrize = killReward + booyahPrize;

        if (totalPrize > 0) {
          // Get current wallet balance
          const currentWallet = parseFloat(participant.users?.wallet_real) || 0;
          const newBalance = currentWallet + totalPrize;

          const currentWins = parseInt(participant.users?.total_wins) || 0;
          const currentGames = parseInt(participant.users?.total_games) || 0;
          const newWins = isBooyahWinner ? currentWins + 1 : currentWins;
          const newGames = currentGames + 1;

          // Update user wallet and stats
          const { error: updateError } = await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: newWins,
              total_games: newGames
            })
            .eq('id', participant.user_id);

          if (updateError) throw updateError;

          // Create transaction record
          await supabase
            .from('transactions')
            .insert([{
              user_id: participant.user_id,
              type: 'tournament_win',
              amount: totalPrize,
              status: 'completed',
              description: `Tournament: ${tournament.title} | ${kills} Kills (₹${killReward}) ${isBooyahWinner ? '+ Booyah (₹' + booyahReward + ')' : ''}`,
              tournament_id: tournament.id
            }]);

          // Send notification
          await supabase
            .from('notifications')
            .insert([{
              user_id: participant.user_id,
              title: `🎉 Tournament Rewards: ${tournament.title}`,
              message: `You earned ₹${totalPrize.toFixed(2)}! | ${kills} kills (₹${killReward}) ${isBooyahWinner ? '+ Booyah Winner (₹' + booyahReward + ')' : ''}. Credits added to your wallet.`,
              type: 'tournament_win',
              read: false
            }]);
        }

        // Update participant record
        await supabase
          .from('tournament_participants')
          .update({
            kills: kills,
            got_booyah: isBooyahWinner,
            prize_won: totalPrize
          })
          .eq('id', participant.id);
      }

      // Update tournament status to completed
      await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournament.id);

      alert('Prizes distributed successfully! Tournament marked as completed.');
      router.push('/admin/tournaments');
    } catch (error) {
      console.error('Error distributing prizes:', error);
      alert('Error distributing prizes: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-white">Tournament not found</p>
        </div>
      </AdminLayout>
    );
  }

  const totalPrizePool = participants.reduce((sum, p) => {
    const kills = killCounts[p.id] || 0;
    const isWinner = p.id === booyahWinner;
    return sum + (kills * 7) + (isWinner ? 5 : 0);
  }, 0);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push('/admin/tournaments')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-all"
            >
              <FaArrowLeft className="text-white" />
            </button>
            <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
          </div>
          <p className="text-discord-text ml-11">{tournament.game}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold ${
          tournament.status === 'upcoming' ? 'bg-blue-600' :
          tournament.status === 'live' ? 'bg-green-600' :
          tournament.status === 'completed' ? 'bg-gray-600' :
          'bg-purple-600'
        } text-white`}>
          {tournament.status.toUpperCase()}
        </div>
      </div>

      {/* Tournament Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaUsers className="text-3xl text-blue-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Participants</p>
          <p className="text-2xl font-bold text-white">
            {participants.length}/{tournament.max_participants}
          </p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaTrophy className="text-3xl text-yellow-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Prize Pool</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaMoneyBillWave className="text-3xl text-green-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Entry Fee</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaSkull className="text-3xl text-red-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Kills</p>
          <p className="text-2xl font-bold text-white">
            {Object.values(killCounts).reduce((sum, kills) => sum + kills, 0)}
          </p>
        </div>
      </div>

      {/* Results Management */}
      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCrown className="text-yellow-400" />
            Manage Tournament Results
          </h2>

          {/* Booyah Winner Selection */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 border border-yellow-500 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaCrown className="text-4xl text-white" />
              <div>
                <h3 className="text-2xl font-bold text-white">Select Booyah Winner (Win Tag)</h3>
                <p className="text-yellow-100">The player who won the match</p>
              </div>
            </div>
            <select
              value={booyahWinner || ''}
              onChange={(e) => setBooyahWinner(e.target.value)}
              className="w-full px-4 py-3 bg-yellow-900 bg-opacity-50 border border-yellow-400 rounded-lg text-white font-semibold focus:outline-none focus:border-yellow-300"
            >
              <option value="">-- Select Booyah Winner --</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.users?.username || p.in_game_name} ({p.in_game_id})
                </option>
              ))}
            </select>
          </div>

          {/* Kill Entry Table */}
          <div className="bg-discord-darkest rounded-xl p-6 border border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaSkull className="text-red-400" />
              Enter Kill Counts (₹7 per kill)
            </h3>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-4 bg-discord-dark border border-gray-700 rounded-lg p-4"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {participant.users?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-discord-text truncate">
                      {participant.in_game_name} • {participant.in_game_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={killCounts[participant.id] || 0}
                      onChange={(e) => handleKillChange(participant.id, e.target.value)}
                      className="w-20 px-3 py-2 bg-discord-darkest border border-gray-600 rounded-lg text-white text-center font-bold focus:outline-none focus:border-purple-600"
                      placeholder="0"
                    />
                    <span className="text-discord-text text-sm">kills</span>
                    {participant.id === booyahWinner && (
                      <FaCrown className="text-yellow-400 text-xl" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Summary */}
          <div className="bg-green-600 bg-opacity-10 border border-green-600 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Prize Distribution Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-discord-dark rounded-lg p-4">
                <p className="text-sm text-discord-text mb-1">Total Kills</p>
                <p className="text-2xl font-bold text-white">
                  {Object.values(killCounts).reduce((sum, k) => sum + k, 0)}
                </p>
              </div>
              <div className="bg-discord-dark rounded-lg p-4">
                <p className="text-sm text-discord-text mb-1">Kill Rewards</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{(Object.values(killCounts).reduce((sum, k) => sum + k, 0) * 7).toFixed(2)}
                </p>
              </div>
              <div className="bg-discord-dark rounded-lg p-4">
                <p className="text-sm text-discord-text mb-1">Total Payout</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{totalPrizePool.toFixed(2)}
                </p>
              </div>
            </div>
            {booyahWinner && (
              <p className="text-sm text-green-400">
                <FaCrown className="inline mr-2" />
                Booyah Winner will receive additional ₹5
              </p>
            )}
          </div>

          {/* Distribute Button */}
          <button
            onClick={distributePrizes}
            disabled={!booyahWinner || processing}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {processing ? 'Processing...' : 'Distribute Prizes & Complete Tournament'}
          </button>
        </div>
      )}

      {/* Participants List */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          All Participants ({participants.length})
        </h2>
        <div className="space-y-3">
          {participants.length === 0 ? (
            <p className="text-center text-discord-text py-8">No participants yet</p>
          ) : (
            participants.map((participant, index) => (
              <div
                key={participant.id}
                className="bg-discord-darkest border border-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {participant.users?.username || 'Unknown User'}
                    </p>
                    <p className="text-sm text-discord-text">
                      {participant.in_game_name} • {participant.in_game_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {participant.kills > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-discord-text">Kills</p>
                      <p className="font-bold text-white">{participant.kills}</p>
                    </div>
                  )}
                  {participant.got_booyah && (
                    <FaCrown className="text-yellow-400 text-2xl" />
                  )}
                  {participant.prize_won > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-discord-text">Won</p>
                      <p className="font-bold text-green-400">₹{parseFloat(participant.prize_won).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
