'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaUsers, FaMoneyBillWave, FaSkull, FaCrown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

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

    if (!confirm('⚠️ CONFIRM PRIZE DISTRIBUTION\n\nThis action will:\n• Distribute all prizes\n• Update player stats\n• Mark tournament as completed\n\nThis CANNOT be undone!\n\nContinue?')) {
      return;
    }

    setProcessing(true);

    try {
      console.log('🚀 Starting prize distribution...');
      
      let totalDistributed = 0;

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
        } else if (preset) {
          killReward = kills * (parseFloat(preset.per_kill_reward) || 0);
          booyahReward = isBooyah ? (parseFloat(preset.booyah_reward) || 0) : 0;
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

          // UPDATE USER: WALLET + GAME STATS + ACHIEVEMENT STATS
          const { error: walletError } = await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: isBooyah ? (participant.users.total_wins || 0) + 1 : (participant.users.total_wins || 0),
              total_games: (participant.users.total_games || 0) + 1,
              // ACHIEVEMENT STATS
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

          // Transaction description
          let desc = tournament.title;
          if (kills > 0) desc += ` | ${kills} Kills: ₹${killReward.toFixed(2)}`;
          if (isBooyah) desc += ` | Booyah: ₹${booyahReward.toFixed(2)}`;
          if (positionReward > 0) desc += ` | Position: ₹${positionReward.toFixed(2)}`;

          // Record transaction
          await supabase.from('transactions').insert({
            user_id: participant.user_id,
            type: 'tournament_win',
            amount: totalPrize,
            status: 'completed',
            description: desc,
            tournament_id: tournament.id
          });

          // Send notification
          await supabase.from('notifications').insert({
            user_id: participant.user_id,
            title: '🎉 Tournament Rewards',
            message: `You earned ₹${totalPrize.toFixed(2)} from ${tournament.title}!${kills > 0 ? ` (${kills} kills)` : ''}${isBooyah ? ' 👑 Booyah!' : ''}`,
            type: 'tournament_win',
            read: false
          });

          console.log(`✅ Updated ${participant.users?.username}`);
        } else {
          // Update stats even if no prize
          const { error: statsError } = await supabase
            .from('users')
            .update({
              total_games: (participant.users.total_games || 0) + 1,
              stat_tournaments_joined: (participant.users.stat_tournaments_joined || 0) + 1,
              stat_total_kills: (participant.users.stat_total_kills || 0) + kills
            })
            .eq('id', participant.user_id);

          if (statsError) {
            console.error('⚠️ Stats error:', statsError);
          }
        }
      }

      // Mark tournament as completed
      await supabase
        .from('tournaments')
        .update({ 
          status: 'completed',
          distributed_prizes: totalDistributed
        })
        .eq('id', tournament.id);

      console.log('✅ ALL PRIZES DISTRIBUTED!');

      alert(
        `✅ PRIZES DISTRIBUTED SUCCESSFULLY!\n\n` +
        `Total: ₹${totalDistributed.toFixed(2)}\n` +
        `Players: ${participants.length}\n` +
        `Booyah Winner: ${participants.find(p => p.id === booyahWinner)?.users?.username}`
      );
      
      router.push('/admin/tournaments');
    } catch (error) {
      console.error('❌ DISTRIBUTION ERROR:', error);
      alert(`❌ ERROR DISTRIBUTING PRIZES\n\n${error.message}\n\nPlease try again.`);
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
          <p className="text-white text-xl mb-4">Tournament not found</p>
          <button onClick={() => router.push('/admin/tournaments')} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            ← Back to Tournaments
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isPreset6 = preset?.preset_number === 6;
  const totalKills = Object.values(killCounts).reduce((s, k) => s + (parseInt(k) || 0), 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <button 
          onClick={() => router.push('/admin/tournaments')} 
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-colors"
        >
          <FaArrowLeft /> Back to Tournaments
        </button>
        <h1 className="text-3xl font-bold text-white mb-1">{tournament.title}</h1>
        <p className="text-discord-text">{tournament.game} • TID-{tournament.id.slice(0, 8)}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text">Participants</p>
          <p className="text-2xl font-bold text-white">{participants.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text">Entry Fee</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(tournament.entry_fee).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaSkull className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text">Total Kills</p>
          <p className="text-2xl font-bold text-white">{totalKills}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text">Prize Pool</p>
          <p className="text-2xl font-bold text-green-400">₹{parseFloat(tournament.prize_pool).toFixed(0)}</p>
        </div>
      </div>

      {/* Manage Results Section */}
      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FaTrophy className="text-yellow-400" />
            Manage Tournament Results
          </h2>

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
          {!isPreset6 && preset?.per_kill_reward > 0 && (
            <div className="bg-discord-darkest rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <FaSkull className="text-red-400" />
                Kill Entry (₹{preset.per_kill_reward} per kill)
              </h3>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-discord-dark rounded-lg p-3 hover:bg-gray-800 transition-colors">
                    <div className="w-16 text-center flex-shrink-0">
                      <p className="text-xs text-discord-text">Seat</p>
                      <p className="font-bold text-purple-400">#{p.seat_number}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{p.users?.username}</p>
                      <p className="text-xs text-discord-text truncate">{p.in_game_name}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={killCounts[p.id] || 0}
                      onChange={(e) => setKillCounts({...killCounts, [p.id]: parseInt(e.target.value) || 0})}
                      className="w-20 px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-center focus:outline-none focus:border-purple-600 flex-shrink-0"
                    />
                    <span className="text-discord-text text-sm w-12 flex-shrink-0">kills</span>
                  </div>
                ))}
              </div>
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
            disabled={!booyahWinner || processing}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Distribute Prizes
              </>
            )}
          </button>
        </div>
      )}

      {/* Participants List */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map(p => (
            <div key={p.id} className="bg-discord-darkest rounded-lg p-3 flex items-center justify-between hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-xs">Seat</span>
                  <span className="font-bold">{p.seat_number}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{p.users?.username}</p>
                  <p className="text-xs text-discord-text truncate">{p.in_game_name} • UID: {p.in_game_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {p.kills > 0 && (
                  <span className="text-white text-sm bg-red-900 bg-opacity-30 px-2 py-1 rounded whitespace-nowrap">
                    {p.kills} kills
                  </span>
                )}
                {p.got_booyah && <FaCrown className="text-2xl text-yellow-400" title="Booyah Winner" />}
                {p.prize_won > 0 && (
                  <span className="text-green-400 font-bold bg-green-900 bg-opacity-30 px-2 py-1 rounded whitespace-nowrap">
                    ₹{parseFloat(p.prize_won).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
