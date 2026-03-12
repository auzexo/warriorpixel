'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminLogger';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaUsers, FaMoneyBillWave, FaSkull, FaCrown, FaCheckCircle, FaExclamationTriangle, FaGamepad } from 'react-icons/fa';

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [preset, setPreset] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booyahWinner, setBooyahWinner] = useState(null);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [third, setThird] = useState(null);
  const [killCounts, setKillCounts] = useState({});
  const [processing, setProcessing] = useState(false);
  
  // NEW: Distribution method for custom tournaments
  const [distributionMethod, setDistributionMethod] = useState('win'); // 'win' or 'kill'
  const [customKillReward, setCustomKillReward] = useState('2'); // Per kill reward for custom

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tournamentId = params.id;

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw new Error('Tournament not found');
      setTournament(tournamentData);

      if (tournamentData.preset_id) {
        const { data: presetData } = await supabase
          .from('tournament_presets')
          .select('*')
          .eq('id', tournamentData.preset_id)
          .single();
        if (presetData) setPreset(presetData);
      }

      const { data: participantsData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seat_number', { ascending: true });

      const participantsWithUsers = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', participant.user_id)
            .single();
          return { ...participant, users: userData };
        })
      );

      setParticipants(participantsWithUsers);

      const initialKills = {};
      participantsWithUsers.forEach(p => {
        initialKills[p.id] = p.kills || 0;
      });
      setKillCounts(initialKills);

      const winner = participantsWithUsers.find(p => p.got_booyah);
      if (winner) setBooyahWinner(winner.id);

      const p1 = participantsWithUsers.find(p => p.position === 1);
      const p2 = participantsWithUsers.find(p => p.position === 2);
      const p3 = participantsWithUsers.find(p => p.position === 3);
      if (p1) setFirst(p1.id);
      if (p2) setSecond(p2.id);
      if (p3) setThird(p3.id);

    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Calculate total kills and max allowed
  const getTotalKills = () => {
    return Object.values(killCounts).reduce((sum, kills) => sum + (parseInt(kills) || 0), 0);
  };

  const getMaxKills = () => {
    return participants.length > 0 ? participants.length - 1 : 0;
  };

  const isKillCountValid = () => {
    const totalKills = getTotalKills();
    const maxKills = getMaxKills();
    return totalKills <= maxKills;
  };

  const saveResults = async () => {
    if (!booyahWinner) {
      alert('❌ Please select the booyah winner first!');
      return;
    }

    const isPreset6 = preset?.preset_number === 6;
    if (isPreset6 && (!first || !second || !third)) {
      alert('❌ Preset 6 requires 1st, 2nd, and 3rd place selections!');
      return;
    }

    // NEW: Validate kill counts for kill-based distribution
    const isCustom = !preset;
    const useKillDistribution = isCustom ? distributionMethod === 'kill' : preset?.per_kill_reward > 0;
    
    if (useKillDistribution && !isKillCountValid()) {
      alert(`❌ Invalid kill count!\n\nTotal kills (${getTotalKills()}) cannot exceed ${getMaxKills()}.\n\nIn a ${participants.length}-player match, maximum ${getMaxKills()} kills are possible (${participants.length} players - 1 winner).`);
      return;
    }

    if (!confirm('⚠️ CONFIRM PRIZE DISTRIBUTION\n\nThis action will:\n• Distribute all prizes\n• Update player stats\n• Mark tournament as completed\n\nThis CANNOT be undone!\n\nContinue?')) {
      return;
    }

    setProcessing(true);

    try {
      console.log('🚀 Starting prize distribution...');
      
      let totalDistributed = 0;
      const perKillReward = isCustom ? parseFloat(customKillReward) : parseFloat(preset?.per_kill_reward || 0);

      for (const participant of participants) {
        const kills = parseInt(killCounts[participant.id]) || 0;
        const isBooyah = participant.id === booyahWinner;
        const isFirst = participant.id === first;
        const isSecond = participant.id === second;
        const isThird = participant.id === third;

        let killReward = 0;
        let booyahReward = 0;
        let positionReward = 0;

        // Calculate rewards
        if (isPreset6) {
          if (isFirst) positionReward = 20;
          if (isSecond) positionReward = 15;
          if (isThird) positionReward = 10;
          if (isBooyah) booyahReward = 5;
        } else if (useKillDistribution) {
          killReward = kills * perKillReward;
        }
        
        // Booyah reward for non-preset6
        if (!isPreset6) {
          if (isCustom) {
            // Custom tournament - booyah gets winner prize from prize pool
            booyahReward = isBooyah ? parseFloat(tournament.prize_pool || 0) : 0;
          } else if (preset) {
            booyahReward = isBooyah ? parseFloat(preset.booyah_reward || 0) : 0;
          }
        }

        const totalPrize = parseFloat((killReward + booyahReward + positionReward).toFixed(2));

        console.log(`Processing ${participant.users?.username}: ${kills} kills, booyah: ${isBooyah}, prize: ₹${totalPrize}`);

        // UPDATE PARTICIPANT
        const { error: updateError } = await supabase
          .from('tournament_participants')
          .update({
            kills: kills,
            got_booyah: isBooyah,
            position: isFirst ? 1 : isSecond ? 2 : isThird ? 3 : null,
            prize_won: totalPrize
          })
          .eq('id', participant.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw new Error(`Failed to update ${participant.users?.username}: ${updateError.message}`);
        }

        // Award prize money and UPDATE STATS
        if (totalPrize > 0) {
          totalDistributed += totalPrize;
          const currentBalance = parseFloat(participant.users.wallet_real || 0);
          const newBalance = parseFloat((currentBalance + totalPrize).toFixed(2));

          const { error: walletError } = await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: isBooyah ? (participant.users.total_wins || 0) + 1 : (participant.users.total_wins || 0),
              total_games: (participant.users.total_games || 0) + 1,
              stat_tournaments_joined: (participant.users.stat_tournaments_joined || 0) + 1,
              stat_tournaments_won: isBooyah ? (participant.users.stat_tournaments_won || 0) + 1 : (participant.users.stat_tournaments_won || 0),
              stat_total_kills: (participant.users.stat_total_kills || 0) + kills,
              stat_total_earnings: (participant.users.stat_total_earnings || 0) + Math.floor(totalPrize)
            })
            .eq('id', participant.user_id);

          if (walletError) {
            console.error('⚠️ Wallet/stats error:', walletError);
            throw new Error(`Failed to update wallet for ${participant.users?.username}: ${walletError.message}`);
          }

          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: participant.user_id,
              type: 'prize',
              amount: totalPrize,
              description: `Prize from ${tournament.title}`,
              status: 'completed'
            });

          if (transactionError) {
            console.error('⚠️ Transaction logging error:', transactionError);
          }
        } else {
          // No prize but still participated
          const { error: statsError } = await supabase
            .from('users')
            .update({
              total_games: (participant.users.total_games || 0) + 1,
              stat_tournaments_joined: (participant.users.stat_tournaments_joined || 0) + 1,
              stat_total_kills: (participant.users.stat_total_kills || 0) + kills
            })
            .eq('id', participant.user_id);

          if (statsError) {
            console.error('⚠️ Stats update error:', statsError);
          }
        }
      }

      // Mark tournament as completed
      const { error: completionError } = await supabase
        .from('tournaments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (completionError) {
        console.error('⚠️ Completion error:', completionError);
      }

      // LOG THE PRIZE DISTRIBUTION
      const distributionType = isPreset6 ? 'position' : useKillDistribution ? 'kill' : 'win';
      await logAdminAction('prize_distribute', {
        tournament_id: params.id,
        tournament_title: tournament.title,
        distribution_type: distributionType,
        total_distributed: totalDistributed,
        total_participants: participants.length,
        total_kills: getTotalKills(),
        winner_username: participants.find(p => p.id === booyahWinner)?.users?.username,
        preset_used: preset?.name || 'Custom'
      });

      alert(`✅ SUCCESS!\n\nPrizes distributed: ₹${totalDistributed.toFixed(2)}\nTournament marked as completed!\n\n${participants.length} players updated.`);
      loadData();

    } catch (error) {
      console.error('❌ Distribution error:', error);
      alert(`❌ Error during distribution:\n\n${error.message}\n\nSome data may have been partially updated. Please check participants manually.`);
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
          <p className="text-white text-xl">Tournament not found</p>
        </div>
      </AdminLayout>
    );
  }

  const isPreset6 = preset?.preset_number === 6;
  const isCustom = !preset;
  const useKillDistribution = isCustom ? distributionMethod === 'kill' : preset?.per_kill_reward > 0;
  const totalKills = getTotalKills();
  const maxKills = getMaxKills();
  const killCountInvalid = useKillDistribution && !isKillCountValid();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/tournaments')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-all"
        >
          <FaArrowLeft />
          Back to Tournaments
        </button>
        <div className="flex items-center gap-3 mb-2">
          <FaTrophy className="text-3xl text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-purple-900 bg-opacity-30 border border-purple-600 text-purple-300 rounded-full text-sm flex items-center gap-1">
            <FaGamepad />
            {tournament.game}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            tournament.status === 'completed' ? 'bg-green-600 text-white' :
            tournament.status === 'live' ? 'bg-red-600 text-white' :
            'bg-yellow-600 text-white'
          }`}>
            {tournament.status.toUpperCase()}
          </span>
          {preset && (
            <span className="px-3 py-1 bg-blue-900 bg-opacity-30 border border-blue-600 text-blue-300 rounded-full text-sm">
              {preset.name}
            </span>
          )}
          {isCustom && (
            <span className="px-3 py-1 bg-orange-900 bg-opacity-30 border border-orange-600 text-orange-300 rounded-full text-sm">
              Custom Tournament
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text">Participants</p>
          <p className="text-2xl font-bold text-white">{participants.length} / {tournament.max_participants}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text">Entry Fee</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(tournament.entry_fee).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text">Prize Pool</p>
          <p className="text-2xl font-bold text-green-400">₹{parseFloat(tournament.prize_pool).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaSkull className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text">Total Kills</p>
          <p className="text-2xl font-bold text-white">{totalKills} / {maxKills}</p>
        </div>
      </div>

      {/* Manage Results Section */}
      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FaTrophy className="text-yellow-400" />
            Manage Tournament Results
          </h2>

          {/* Distribution Method Toggle (Custom Tournaments Only) */}
          {isCustom && (
            <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-white mb-3">Distribution Method</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setDistributionMethod('win')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    distributionMethod === 'win' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-discord-darkest text-discord-text hover:bg-gray-700'
                  }`}
                >
                  <FaCrown className="inline mr-2" />
                  Win Only
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMethod('kill')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    distributionMethod === 'kill' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-discord-darkest text-discord-text hover:bg-gray-700'
                  }`}
                >
                  <FaSkull className="inline mr-2" />
                  Kill Based
                </button>
              </div>

              {distributionMethod === 'kill' && (
                <div>
                  <label className="block text-white font-semibold mb-2">Per Kill Reward (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customKillReward}
                    onChange={(e) => setCustomKillReward(e.target.value)}
                    className="w-full px-4 py-3 bg-discord-darkest border border-blue-600 text-white rounded-lg font-bold"
                  />
                  <p className="text-xs text-blue-300 mt-2">
                    Winner gets prize pool (₹{tournament.prize_pool}) + kill rewards
                  </p>
                </div>
              )}

              {distributionMethod === 'win' && (
                <p className="text-sm text-blue-300">
                  Winner gets full prize pool: ₹{tournament.prize_pool}
                </p>
              )}
            </div>
          )}

          {/* Booyah Winner Selection */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaCrown />
              Booyah Winner (Win Tag)
            </h3>
            <select
              value={booyahWinner || ''}
              onChange={(e) => setBooyahWinner(e.target.value)}
              className="w-full px-4 py-3 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <option value="">-- Select Booyah Winner --</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  Seat #{p.seat_number} - {p.users?.username} ({p.in_game_name})
                </option>
              ))}
            </select>
          </div>

          {/* Preset 6 Position Selection */}
          {isPreset6 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥇 1st Place (₹20)</h4>
                <select 
                  value={first || ''} 
                  onChange={(e) => setFirst(e.target.value)} 
                  className="w-full px-3 py-2 bg-discord-darkest border border-yellow-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Select Player</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>Seat #{p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥈 2nd Place (₹15)</h4>
                <select 
                  value={second || ''} 
                  onChange={(e) => setSecond(e.target.value)} 
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">Select Player</option>
                  {participants.filter(p => p.id !== first).map(p => (
                    <option key={p.id} value={p.id}>Seat #{p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
              <div className="bg-orange-600 bg-opacity-10 border border-orange-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥉 3rd Place (₹10)</h4>
                <select 
                  value={third || ''} 
                  onChange={(e) => setThird(e.target.value)} 
                  className="w-full px-3 py-2 bg-discord-darkest border border-orange-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Select Player</option>
                  {participants.filter(p => p.id !== first && p.id !== second).map(p => (
                    <option key={p.id} value={p.id}>Seat #{p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Kill Entry Section */}
          {useKillDistribution && (
            <div className="bg-discord-darkest rounded-xl p-6 mb-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FaSkull className="text-red-400" />
                  Kill Entry (₹{isCustom ? customKillReward : preset.per_kill_reward} per kill)
                </h3>
                <div className="text-right">
                  <p className={`text-sm font-bold ${killCountInvalid ? 'text-red-400' : 'text-green-400'}`}>
                    Total: {totalKills} / {maxKills} kills
                  </p>
                  {killCountInvalid && (
                    <p className="text-xs text-red-400">Exceeds maximum!</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {participants.map(p => (
                  <div key={p.id} className="bg-discord-dark rounded-lg p-4 hover:bg-gray-800 transition-colors border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-14 h-14 bg-purple-600 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0">
                        <span className="text-xs opacity-75">Seat</span>
                        <span className="text-lg font-bold">#{p.seat_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg truncate">{p.users?.username}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-purple-400 font-medium">
                            <FaGamepad className="inline text-xs mr-1" />
                            {tournament.game}
                          </span>
                          <span className="text-sm text-discord-text">•</span>
                          <span className="text-sm text-blue-400 font-medium">{p.in_game_name}</span>
                          <span className="text-sm text-discord-text">•</span>
                          <span className="text-sm text-green-400 font-mono">UID: {p.in_game_id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-white font-semibold text-sm flex-shrink-0">Kills:</label>
                      <input
                        type="number"
                        min="0"
                        max={maxKills}
                        value={killCounts[p.id] || 0}
                        onChange={(e) => setKillCounts({...killCounts, [p.id]: parseInt(e.target.value) || 0})}
                        className="flex-1 px-4 py-2 bg-discord-darkest border border-gray-600 text-white rounded-lg text-center font-bold text-lg focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-green-400 font-bold text-sm flex-shrink-0 w-20 text-right">
                        ₹{((parseInt(killCounts[p.id]) || 0) * (isCustom ? parseFloat(customKillReward) : parseFloat(preset.per_kill_reward))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {killCountInvalid && (
                <div className="mt-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-4">
                  <p className="text-red-400 font-bold text-sm">
                    ⚠️ Kill count validation failed!
                  </p>
                  <p className="text-red-300 text-xs mt-1">
                    With {participants.length} players, maximum {maxKills} kills are possible. Current total: {totalKills}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Warning Banner */}
          {!booyahWinner && (
            <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaExclamationTriangle className="text-2xl text-red-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-white">Booyah Winner Required</p>
                <p className="text-sm text-red-300">Please select the booyah winner before distributing prizes</p>
              </div>
            </div>
          )}

          {/* Distribute Button */}
          <button
            onClick={saveResults}
            disabled={!booyahWinner || processing || killCountInvalid}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Prize Distribution...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Distribute Prizes & Complete Tournament
              </>
            )}
          </button>
        </div>
      )}

      {/* Participants List */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
        <div className="space-y-3">
          {participants.map(p => (
            <div key={p.id} className="bg-discord-darkest rounded-lg p-4 hover:bg-gray-800 transition-colors border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-purple-600 rounded-full flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-xs opacity-75">Seat</span>
                  <span className="text-lg font-bold">{p.seat_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg truncate flex items-center gap-2">
                    {p.users?.username}
                    {p.got_booyah && <FaCrown className="text-yellow-400" title="Booyah Winner" />}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-purple-400 font-medium">
                      <FaGamepad className="inline text-xs mr-1" />
                      {tournament.game}
                    </span>
                    <span className="text-discord-text">•</span>
                    <span className="text-blue-400 font-medium">{p.in_game_name}</span>
                    <span className="text-discord-text">•</span>
                    <span className="text-green-400 font-mono">UID: {p.in_game_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.kills > 0 && (
                  <span className="text-white text-sm bg-red-600 bg-opacity-20 border border-red-600 px-3 py-1 rounded-full font-bold">
                    {p.kills} kills
                  </span>
                )}
                {p.prize_won > 0 && (
                  <span className="text-green-400 font-bold bg-green-600 bg-opacity-20 border border-green-600 px-3 py-1 rounded-full">
                    ₹{parseFloat(p.prize_won).toFixed(2)}
                  </span>
                )}
                {p.position === 1 && <span className="text-yellow-400 font-bold">🥇 1st</span>}
                {p.position === 2 && <span className="text-gray-400 font-bold">🥈 2nd</span>}
                {p.position === 3 && <span className="text-orange-400 font-bold">🥉 3rd</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
