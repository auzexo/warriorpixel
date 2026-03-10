'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaUsers, FaMoneyBillWave, FaSkull, FaCrown, FaCheckCircle } from 'react-icons/fa';

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
      console.log('Loading tournament:', tournamentId);

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
      alert('❌ Select booyah winner');
      return;
    }

    const isPreset6 = preset?.preset_number === 6;
    if (isPreset6 && (!first || !second || !third)) {
      alert('❌ Preset 6 needs 1st/2nd/3rd');
      return;
    }

    if (!confirm('Distribute prizes?')) return;

    setProcessing(true);

    try {
      for (const participant of participants) {
        const kills = killCounts[participant.id] || 0;
        const isBooyah = participant.id === booyahWinner;

        let killReward = 0;
        let booyahReward = 0;
        let positionReward = 0;

        if (isPreset6) {
          if (participant.id === first) positionReward = 20;
          if (participant.id === second) positionReward = 15;
          if (participant.id === third) positionReward = 10;
          if (isBooyah) booyahReward = 5;
        } else if (preset) {
          killReward = kills * (preset.per_kill_reward || 0);
          booyahReward = isBooyah ? (preset.booyah_reward || 0) : 0;
        }

        const totalPrize = killReward + booyahReward + positionReward;

        await supabase
          .from('tournament_participants')
          .update({
            kills,
            got_booyah: isBooyah,
            position: participant.id === first ? 1 : participant.id === second ? 2 : participant.id === third ? 3 : null,
            prize_won: totalPrize
          })
          .eq('id', participant.id);

        if (totalPrize > 0) {
          const newBalance = parseFloat(participant.users.wallet_real) + totalPrize;
          await supabase
            .from('users')
            .update({
              wallet_real: newBalance,
              total_wins: isBooyah ? (participant.users.total_wins || 0) + 1 : participant.users.total_wins,
              total_games: (participant.users.total_games || 0) + 1
            })
            .eq('id', participant.user_id);

          let desc = tournament.title;
          if (kills > 0) desc += ` | ${kills} Kills: ₹${killReward}`;
          if (isBooyah) desc += ` | Booyah: ₹${booyahReward}`;
          if (positionReward > 0) desc += ` | Position: ₹${positionReward}`;

          await supabase.from('transactions').insert({
            user_id: participant.user_id,
            type: 'tournament_win',
            amount: totalPrize,
            status: 'completed',
            description: desc,
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
        .update({ status: 'completed' })
        .eq('id', tournament.id);

      alert('✅ Prizes distributed!');
      router.push('/admin/tournaments');
    } catch (error) {
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
        <div className="text-center py-12">
          <p className="text-white text-xl mb-4">Tournament not found</p>
          <button onClick={() => router.push('/admin/tournaments')} className="px-6 py-3 bg-gray-700 text-white rounded-lg">
            ← Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isPreset6 = preset?.preset_number === 6;
  const totalKills = Object.values(killCounts).reduce((s, k) => s + k, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <button onClick={() => router.push('/admin/tournaments')} className="flex items-center gap-2 text-discord-text hover:text-white mb-4">
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
        <p className="text-discord-text">{tournament.game} • TID-{tournament.id}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaUsers className="text-2xl text-blue-400 mb-2" />
          <p className="text-xs text-discord-text">Participants</p>
          <p className="text-2xl font-bold text-white">{participants.length}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaMoneyBillWave className="text-2xl text-green-400 mb-2" />
          <p className="text-xs text-discord-text">Entry</p>
          <p className="text-2xl font-bold text-white">₹{tournament.entry_fee}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaSkull className="text-2xl text-red-400 mb-2" />
          <p className="text-xs text-discord-text">Kills</p>
          <p className="text-2xl font-bold text-white">{totalKills}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <FaTrophy className="text-2xl text-yellow-400 mb-2" />
          <p className="text-xs text-discord-text">Prize</p>
          <p className="text-2xl font-bold text-green-400">₹{tournament.prize_pool}</p>
        </div>
      </div>

      {tournament.status !== 'completed' && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Manage Results</h2>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">👑 Booyah Winner</h3>
            <select
              value={booyahWinner || ''}
              onChange={(e) => setBooyahWinner(e.target.value)}
              className="w-full px-4 py-3 bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg text-white"
            >
              <option value="">-- Select --</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>Seat {p.seat_number} - {p.users?.username}</option>
              ))}
            </select>
          </div>

          {isPreset6 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥇 1st (₹20)</h4>
                <select value={first || ''} onChange={(e) => setFirst(e.target.value)} className="w-full px-3 py-2 bg-discord-darkest text-white rounded-lg">
                  <option value="">Select</option>
                  {participants.map(p => <option key={p.id} value={p.id}>Seat {p.seat_number}</option>)}
                </select>
              </div>
              <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥈 2nd (₹15)</h4>
                <select value={second || ''} onChange={(e) => setSecond(e.target.value)} className="w-full px-3 py-2 bg-discord-darkest text-white rounded-lg">
                  <option value="">Select</option>
                  {participants.filter(p => p.id !== first).map(p => <option key={p.id} value={p.id}>Seat {p.seat_number}</option>)}
                </select>
              </div>
              <div className="bg-orange-600 bg-opacity-10 border border-orange-600 rounded-xl p-4">
                <h4 className="font-bold text-white mb-2">🥉 3rd (₹10)</h4>
                <select value={third || ''} onChange={(e) => setThird(e.target.value)} className="w-full px-3 py-2 bg-discord-darkest text-white rounded-lg">
                  <option value="">Select</option>
                  {participants.filter(p => p.id !== first && p.id !== second).map(p => <option key={p.id} value={p.id}>Seat {p.seat_number}</option>)}
                </select>
              </div>
            </div>
          )}

          {!isPreset6 && preset?.per_kill_reward > 0 && (
            <div className="bg-discord-darkest rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4">Kill Entry (₹{preset.per_kill_reward} each)</h3>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-discord-dark rounded-lg p-3">
                    <div className="w-16 text-center">
                      <p className="text-xs text-discord-text">Seat</p>
                      <p className="font-bold text-purple-400">#{p.seat_number}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{p.users?.username}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={killCounts[p.id] || 0}
                      onChange={(e) => setKillCounts({...killCounts, [p.id]: parseInt(e.target.value) || 0})}
                      className="w-20 px-3 py-2 bg-discord-darkest text-white rounded-lg text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={saveResults}
            disabled={!booyahWinner || processing}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {processing ? 'Processing...' : 'Distribute Prizes'}
          </button>
        </div>
      )}

      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map(p => (
            <div key={p.id} className="bg-discord-darkest rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex flex-col items-center justify-center text-white">
                  <span className="text-xs">Seat</span>
                  <span className="font-bold">{p.seat_number}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{p.users?.username}</p>
                  <p className="text-xs text-discord-text">{p.in_game_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {p.kills > 0 && <span className="text-white">{p.kills} kills</span>}
                {p.got_booyah && <FaCrown className="text-yellow-400" />}
                {p.prize_won > 0 && <span className="text-green-400 font-bold">₹{p.prize_won}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
