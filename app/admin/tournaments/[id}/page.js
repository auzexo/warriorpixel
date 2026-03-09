'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaUsers, FaMoneyBillWave, FaSkull, FaCrown, FaCheckCircle, FaHashtag } from 'react-icons/fa';

export default function TournamentManagePage() {
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
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      console.log('Loading tournament ID:', params.id);

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (tournamentError) {
        console.error('Tournament error:', tournamentError);
        throw new Error('Tournament not found');
      }

      console.log('Tournament loaded:', tournamentData);
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
        .eq('tournament_id', params.id)
        .order('seat_number', { ascending: true });

      const participantsWithUsers = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const { data: userData } = await supabase
            .from('users')
            .select('id, username, email, wallet_real')
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

      const existingWinner = participantsWithUsers.find(p => p.got_booyah);
      if (existingWinner) setBooyahWinner(existingWinner.id);

      const firstPlace = participantsWithUsers.find(p => p.position === 1);
      const secondPlace = participantsWithUsers.find(p => p.position === 2);
      const thirdPlace = participantsWithUsers.find(p => p.position === 3);

      if (firstPlace) setFirst(firstPlace.id);
      if (secondPlace) setSecond(secondPlace.id);
      if (thirdPlace) setThird(thirdPlace.id);

    } catch (error) {
      console.error('Error:', error);
      alert('Error loading tournament: ' + error.message);
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

  const saveResults = async () => {
    if (!booyahWinner) {
      alert('❌ Please select the Booyah winner');
      return;
    }

    const isPreset6 = preset?.preset_number === 6;
    if (isPreset6 && (!first || !second || !third)) {
      alert('❌ Preset 6 requires 1st, 2nd, and 3rd place');
      return;
    }

    if (!confirm('Distribute prizes?\n\nThis cannot be undone!')) {
      return;
    }

    setProcessing(true);

    try {
      let totalDistributed = 0;

      for (const participant of participants) {
        const kills = killCounts[participant.id] || 0;
        const isBooyah = participant.id === booyahWinner;
        const isFirst = participant.id === first;
        const isSecond = participant.id === second;
        const isThird = participant.id === third;

        let killReward = 0;
        let booyahReward = 0;
        let positionReward = 0;

        if (isPreset6) {
          if (isFirst) positionReward = 20;
          if (isSecond) positionReward = 15;
          if (isThird) positionReward = 10;
          if (isBooyah) booyahReward = 5;
        } else if (preset) {
          killReward = kills * (preset.per_kill_reward || 0);
          booyahReward = isBooyah ? (preset.booyah_reward || 0) : 0;
        }

        const totalPrize = killReward + booyahReward + positionReward;

        await supabase
          .from('tournament_participants')
          .update({
            kills: kills,
            got_booyah: isBooyah,
            position: isFirst ? 1 : isSecond ? 2 : isThird ? 3 : null,
            prize_won: totalPrize
          })
          .eq('id', participant.id);

        if (totalPrize > 0) {
          totalDistributed += totalPrize;
          const currentWallet = parseFloat(participant.users?.wallet_real) || 0;
          const newBalance = currentWallet + totalPrize;

          await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: isBooyah ? (participant.users.total_wins || 0) + 1 : (participant.users.total_wins || 0),
              total_games: (participant.users.total_games || 0) + 1
            })
            .eq('id', participant.user_id);

          let description = `${tournament.title}`;
          if (kills > 0) description += ` | ${kills} Kills: ₹${killReward}`;
          if (isBooyah) description += ` | Booyah: ₹${booyahReward}`;
          if (positionReward > 0) {
            const pos = isFirst ? '1st' : isSecond ? '2nd' : '3rd';
            description += ` | ${pos}: ₹${positionReward}`;
          }

          await supabase.from('transactions').insert({
            user_id: participant.user_id,
            type: 'tournament_win',
            amount: totalPrize,
            status: 'completed',
            description: description,
            tournament_id: tournament.id
          });

          await supabase.from('notifications').insert({
            user_id: participant.user_id,
            title: '🎉 Tournament Rewards',
            message: `You earned ₹${totalPrize.toFixed(2)} from ${tournament.title}!`,
            type: 'tournament_win',
            read: false
          });
        }
      }

      await supabase
        .from('tournaments')
        .update({ 
          status: 'completed',
          distributed_prizes: totalDistributed
        })
        .eq('id', tournament.id);

      alert(`✅ Prizes distributed!\nTotal: ₹${totalDistributed.toFixed(2)}`);
      router.push('/admin/tournaments');

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
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
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-xl p-8">
            <p className="text-2xl font-bold text-white mb-2">Tournament Not Found</p>
            <p className="text-red-400 mb-6">Tournament ID: {params.id}</p>
            <button
              onClick={() => router.push('/admin/tournaments')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold"
            >
              ← Back to Tournaments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isPreset6 = preset?.preset_number === 6;
  const totalKills = Object.values(killCounts).reduce((sum, k) => sum + k, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/tournaments')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4"
        >
          <FaArrowLeft />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">{tournament.title}</h1>
        <div className="flex items-center gap-4">
          <p className="text-discord-text">{tournament.game}</p>
          {preset && <p className="text-discord-text">• {preset.name}</p>}
          <p className="text-discord-text font-mono">• TID-{tournament.id}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text">Participants</p>
          <p className="text-2xl font-bold text-white">{participants.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text">Entry Fee</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaSkull className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text">Total Kills</p>
          <p className="text-2xl font-bold text-white">{totalKills}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text">Prize Pool</p>
          <p className="text-2xl font-bold text-green-400">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Preset Info */}
      {preset && (
        <div className="bg-purple-600 bg-opacity-10 border border-purple-600 rounded-xl p-4 mb-8">
          <h3 className="font-bold text-white mb-2">Preset: {preset.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-purple-400">Per Kill</p>
              <p className="font-bold text-white">₹{preset.per_kill_reward}</p>
            </div>
            <div>
              <p className="text-purple-400">Booyah</p>
              <p className="font-bold text-white">₹{preset.booyah_reward}</p>
            </div>
            {isPreset6 && (
              <>
                <div>
                  <p className="text-purple-400">1st Place</p>
                  <p className="font-bold text-white">₹20</p>
                </div>
                <div>
                  <p className="text-purple-400">2nd/3rd</p>
                  <p className="font-bold text-white">₹15/₹10</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results Management */}
      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Manage Results</h2>

          {/* Booyah Winner */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaCrown className="text-3xl text-white" />
              <div>
                <h3 className="text-xl font-bold text-white">Booyah Winner (Win Tag)</h3>
                <p className="text-yellow-100 text-sm">Only 1 person gets win tag + booyah reward</p>
              </div>
            </div>
            <select
              value={booyahWinner || ''}
              onChange={(e) => setBooyahWinner(e.target.value)}
              className="w-full px-4 py-3 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white font-semibold"
            >
              <option value="">-- Select Winner --</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  Seat {p.seat_number} - {p.users?.username || p.in_game_name} ({p.in_game_id})
                </option>
              ))}
            </select>
          </div>

          {/* Preset 6: Top 3 */}
          {isPreset6 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥇 1st - ₹20</h4>
                <select
                  value={first || ''}
                  onChange={(e) => setFirst(e.target.value)}
                  className="w-full px-3 py-2 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white"
                >
                  <option value="">Select</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>Seat {p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥈 2nd - ₹15</h4>
                <select
                  value={second || ''}
                  onChange={(e) => setSecond(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 bg-opacity-30 border border-gray-400 rounded-lg text-white"
                >
                  <option value="">Select</option>
                  {participants.filter(p => p.id !== first).map(p => (
                    <option key={p.id} value={p.id}>Seat {p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥉 3rd - ₹10</h4>
                <select
                  value={third || ''}
                  onChange={(e) => setThird(e.target.value)}
                  className="w-full px-3 py-2 bg-orange-900 bg-opacity-30 border border-orange-400 rounded-lg text-white"
                >
                  <option value="">Select</option>
                  {participants.filter(p => p.id !== first && p.id !== second).map(p => (
                    <option key={p.id} value={p.id}>Seat {p.seat_number} - {p.users?.username}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Kill Entry */}
          {!isPreset6 && preset?.per_kill_reward > 0 && (
            <div className="bg-discord-darkest rounded-xl p-6 border border-gray-700 mb-6">
              <h3 className="font-bold text-white mb-4">Enter Kills (₹{preset.per_kill_reward} per kill)</h3>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-discord-dark border border-gray-700 rounded-lg p-3">
                    <div className="w-16 text-center">
                      <p className="text-xs text-discord-text">Seat</p>
                      <p className="font-bold text-purple-400">#{p.seat_number}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{p.users?.username || p.in_game_name}</p>
                      <p className="text-xs text-discord-text">{p.in_game_id}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={killCounts[p.id] || 0}
                      onChange={(e) => handleKillChange(p.id, e.target.value)}
                      className="w-20 px-3 py-2 bg-discord-darkest border border-gray-600 rounded-lg text-white text-center font-bold"
                    />
                    <span className="text-discord-text text-sm">kills</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={saveResults}
            disabled={!booyahWinner || processing}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {processing ? 'Processing...' : 'Save & Distribute Prizes'}
          </button>
        </div>
      )}

      {/* Participants */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.length === 0 ? (
            <p className="text-center text-discord-text py-8">No participants</p>
          ) : (
            participants.map(p => (
              <div key={p.id} className="bg-discord-darkest border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex flex-col items-center justify-center text-white">
                    <span className="text-xs">Seat</span>
                    <span className="font-bold">{p.seat_number}</span>
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
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
