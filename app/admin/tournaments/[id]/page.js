'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaUsers, FaMoneyBillWave, FaCrown, FaSkull, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [preset, setPreset] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booyahWinner, setBooyahWinner] = useState(null);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [third, setThird] = useState(null);
  const [killCounts, setKillCounts] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTournamentDetails();
  }, [params.id]);

  const loadTournamentDetails = async () => {
    try {
      setError(null);

      // Load tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (tournamentError) {
        console.error('Tournament error:', tournamentError);
        throw new Error('Tournament not found');
      }

      setTournament(tournamentData);

      // Load preset if exists
      if (tournamentData.preset_id) {
        const { data: presetData } = await supabase
          .from('tournament_presets')
          .select('*')
          .eq('id', tournamentData.preset_id)
          .single();

        if (presetData) {
          setPreset(presetData);
        }
      }

      // Load participants with user data
      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', params.id)
        .order('created_at', { ascending: true });

      if (participantsError) {
        console.error('Participants error:', participantsError);
        throw new Error('Failed to load participants');
      }

      // Load user data separately for each participant
      const participantsWithUsers = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const { data: userData } = await supabase
            .from('users')
            .select('id, username, email, wallet_real, total_wins, total_games')
            .eq('id', participant.user_id)
            .single();

          return {
            ...participant,
            users: userData
          };
        })
      );

      setParticipants(participantsWithUsers);

      // Initialize kill counts
      const initialKills = {};
      participantsWithUsers.forEach(p => {
        initialKills[p.id] = p.kills || 0;
      });
      setKillCounts(initialKills);

      // Set existing results if already completed
      const existingWinner = participantsWithUsers.find(p => p.got_booyah);
      if (existingWinner) {
        setBooyahWinner(existingWinner.id);
      }

      const firstPlace = participantsWithUsers.find(p => p.position === 1);
      const secondPlace = participantsWithUsers.find(p => p.position === 2);
      const thirdPlace = participantsWithUsers.find(p => p.position === 3);

      if (firstPlace) setFirst(firstPlace.id);
      if (secondPlace) setSecond(secondPlace.id);
      if (thirdPlace) setThird(thirdPlace.id);

    } catch (error) {
      console.error('Error loading tournament:', error);
      setError(error.message || 'Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleKillChange = (participantId, kills) => {
    const killValue = Math.max(0, parseInt(kills) || 0);
    setKillCounts(prev => ({
      ...prev,
      [participantId]: killValue
    }));
  };

  const calculatePrizes = () => {
    const results = [];
    const isPreset6 = preset?.preset_number === 6;

    participants.forEach(participant => {
      const kills = killCounts[participant.id] || 0;
      const isBooyah = participant.id === booyahWinner;
      const isFirst = participant.id === first;
      const isSecond = participant.id === second;
      const isThird = participant.id === third;

      let killReward = 0;
      let booyahReward = 0;
      let positionReward = 0;

      if (isPreset6) {
        // Preset 6: No kill rewards, position + booyah
        if (isFirst) positionReward = 20;
        if (isSecond) positionReward = 15;
        if (isThird) positionReward = 10;
        if (isBooyah) booyahReward = 5;
      } else {
        // Other presets: kills + booyah
        killReward = kills * (preset?.per_kill_reward || 0);
        booyahReward = isBooyah ? (preset?.booyah_reward || 0) : 0;
      }

      const totalPrize = killReward + booyahReward + positionReward;

      if (totalPrize > 0 || isFirst || isSecond || isThird || isBooyah) {
        results.push({
          participant,
          kills,
          killReward,
          booyahReward,
          positionReward,
          totalPrize,
          position: isFirst ? 1 : isSecond ? 2 : isThird ? 3 : null,
          isBooyah
        });
      }
    });

    return results;
  };

  const saveAllResults = async () => {
    if (!booyahWinner) {
      alert('Please select the Booyah winner');
      return;
    }

    const isPreset6 = preset?.preset_number === 6;
    if (isPreset6 && (!first || !second || !third)) {
      alert('Preset 6 requires selecting 1st, 2nd, and 3rd place winners');
      return;
    }

    if (!confirm('Distribute all prizes and complete tournament?\n\nThis action cannot be undone!')) {
      return;
    }

    setProcessing(true);

    try {
      const results = calculatePrizes();

      // Process each result
      for (const result of results) {
        if (result.totalPrize > 0) {
          // Update user wallet and stats
          const currentWallet = parseFloat(result.participant.users?.wallet_real) || 0;
          const currentWins = parseInt(result.participant.users?.total_wins) || 0;
          const currentGames = parseInt(result.participant.users?.total_games) || 0;

          const newBalance = currentWallet + result.totalPrize;
          const newWins = result.isBooyah ? currentWins + 1 : currentWins;
          const newGames = currentGames + 1;

          const { error: updateError } = await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: newWins,
              total_games: newGames
            })
            .eq('id', result.participant.user_id);

          if (updateError) throw updateError;

          // Create transaction
          let description = `${tournament.title}`;
          if (result.kills > 0) description += ` | ${result.kills} Kills: ₹${result.killReward}`;
          if (result.isBooyah) description += ` | Booyah: ₹${result.booyahReward}`;
          if (result.position) description += ` | ${result.position === 1 ? '1st' : result.position === 2 ? '2nd' : '3rd'} Place: ₹${result.positionReward}`;

          await supabase
            .from('transactions')
            .insert({
              user_id: result.participant.user_id,
              type: 'tournament_win',
              amount: result.totalPrize,
              status: 'completed',
              description: description,
              tournament_id: tournament.id
            });

          // Send notification
          await supabase
            .from('notifications')
            .insert({
              user_id: result.participant.user_id,
              title: `🎉 Tournament Rewards`,
              message: `You earned ₹${result.totalPrize.toFixed(2)} from ${tournament.title}!`,
              type: 'tournament_win',
              read: false
            });
        }

        // Update participant record
        await supabase
          .from('tournament_participants')
          .update({
            kills: result.kills,
            got_booyah: result.isBooyah,
            position: result.position,
            prize_won: result.totalPrize
          })
          .eq('id', result.participant.id);
      }

      // Mark tournament as completed
      await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournament.id);

      alert(`✅ Success!\n\nPrizes distributed to ${results.length} participants.\nTournament marked as completed.`);
      router.push('/admin/tournaments');

    } catch (error) {
      console.error('Error distributing prizes:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-discord-text">Loading tournament...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-xl p-8 text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Tournament</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/admin/tournaments')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              ← Back to Tournaments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-white text-xl mb-4">Tournament not found</p>
          <button
            onClick={() => router.push('/admin/tournaments')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            ← Back to Tournaments
            </button>
        </div>
      </AdminLayout>
    );
  }

  const prizeResults = calculatePrizes();
  const totalPayout = prizeResults.reduce((sum, r) => sum + r.totalPrize, 0);
  const isPreset6 = preset?.preset_number === 6;

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
          <p className="text-discord-text ml-11">
            {tournament.game} {preset && `• ${preset.name}`}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold ${
          tournament.status === 'upcoming' ? 'bg-blue-600' :
          tournament.status === 'live' ? 'bg-green-600' :
          tournament.status === 'completed' ? 'bg-gray-600' :
          'bg-purple-600'
        } text-white uppercase`}>
          {tournament.status}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text mb-1">Participants</p>
          <p className="text-xl font-bold text-white">{participants.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text mb-1">Entry Fee</p>
          <p className="text-xl font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaSkull className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text mb-1">Total Kills</p>
          <p className="text-xl font-bold text-white">
            {Object.values(killCounts).reduce((sum, k) => sum + k, 0)}
          </p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text mb-1">Total Payout</p>
          <p className="text-xl font-bold text-green-400">₹{totalPayout.toFixed(2)}</p>
        </div>
      </div>

      {/* Results Management */}
      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Manage Tournament Results</h2>

          {/* Booyah Winner */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaCrown className="text-3xl text-white" />
              <div>
                <h3 className="text-xl font-bold text-white">Booyah Winner (Win Tag)</h3>
                <p className="text-yellow-100 text-sm">Player who won the match</p>
              </div>
            </div>
            <select
              value={booyahWinner || ''}
              onChange={(e) => setBooyahWinner(e.target.value)}
              className="w-full px-4 py-3 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white font-semibold focus:outline-none focus:border-yellow-300"
            >
              <option value="">-- Select Booyah Winner --</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.users?.username || p.in_game_name} ({p.in_game_id})
                </option>
              ))}
            </select>
          </div>

          {/* Preset 6: Top 3 Selection */}
          {isPreset6 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥇 1st Place - ₹20</h4>
                <select
                  value={first || ''}
                  onChange={(e) => setFirst(e.target.value)}
                  className="w-full px-3 py-2 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Select 1st</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.users?.username || p.in_game_name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥈 2nd Place - ₹15</h4>
                <select
                  value={second || ''}
                  onChange={(e) => setSecond(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 bg-opacity-30 border border-gray-400 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Select 2nd</option>
                  {participants.filter(p => p.id !== first).map(p => (
                    <option key={p.id} value={p.id}>{p.users?.username || p.in_game_name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥉 3rd Place - ₹10</h4>
                <select
                  value={third || ''}
                  onChange={(e) => setThird(e.target.value)}
                  className="w-full px-3 py-2 bg-orange-900 bg-opacity-30 border border-orange-400 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Select 3rd</option>
                  {participants.filter(p => p.id !== first && p.id !== second).map(p => (
                    <option key={p.id} value={p.id}>{p.users?.username || p.in_game_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Kill Entry (if not Preset 6 or Preset 7) */}
          {!isPreset6 && preset?.preset_number !== 7 && preset?.per_kill_reward > 0 && (
            <div className="bg-discord-darkest rounded-xl p-6 border border-gray-700 mb-6">
              <h3 className="font-bold text-white mb-4">
                Enter Kills (₹{preset.per_kill_reward} per kill)
              </h3>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 bg-discord-dark border border-gray-700 rounded-lg p-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{p.users?.username || p.in_game_name}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={killCounts[p.id] || 0}
                      onChange={(e) => handleKillChange(p.id, e.target.value)}
                      className="w-20 px-3 py-2 bg-discord-darkest border border-gray-600 rounded-lg text-white text-center font-bold focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-discord-text text-sm">kills</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save All Button */}
          <button
            onClick={saveAllResults}
            disabled={!booyahWinner || processing}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {processing ? 'Processing...' : 'Save All & Distribute Prizes'}
          </button>
        </div>
      )}

      {/* Participants */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map((p, i) => (
            <div key={p.id} className="bg-discord-darkest border border-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{p.users?.username || 'Unknown'}</p>
                  <p className="text-xs text-discord-text">{p.in_game_name} • {p.in_game_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {p.kills > 0 && <span className="text-white text-sm">{p.kills} kills</span>}
                {p.got_booyah && <FaCrown className="text-yellow-400" />}
                {p.prize_won > 0 && <span className="text-green-400 font-bold text-sm">₹{parseFloat(p.prize_won).toFixed(2)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
