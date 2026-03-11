'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FaTrophy, FaClock, FaFire, FaInfoCircle, FaTimes, FaCheckCircle, FaUsers, FaMoneyBillWave, FaSkull, FaCrown } from 'react-icons/fa';

export default function TournamentsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState(null);
  const [joinData, setJoinData] = useState({
    in_game_name: '',
    in_game_id: ''
  });

  useEffect(() => {
    loadTournaments();
  }, [filter]);

  const loadTournaments = async () => {
    try {
      let query = supabase
        .from('tournaments')
        .select('*, preset:tournament_presets(*)')
        .order('start_time', { ascending: true });

      if (filter === 'upcoming') {
        query = query.eq('status', 'upcoming');
      } else if (filter === 'live') {
        query = query.eq('status', 'live');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;

      const tournamentsWithCounts = await Promise.all(
        (data || []).map(async (tournament) => {
          const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          return {
            ...tournament,
            participantCount: count || 0
          };
        })
      );

      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (tournament) => {
    setSelectedTournament(tournament);
    setShowModal(true);

    if (user) {
      const { data } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserParticipation(data);
    } else {
      setUserParticipation(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTournament(null);
    setUserParticipation(null);
    setJoinData({ in_game_name: '', in_game_id: '' });
  };

  const handleJoin = async () => {
    if (!user) {
      alert('Please login to join tournaments');
      router.push('/');
      return;
    }

    if (!joinData.in_game_name || !joinData.in_game_id) {
      alert('Please enter your in-game name and ID');
      return;
    }

    if (!joinData.in_game_name.trim() || !joinData.in_game_id.trim()) {
      alert('In-game name and ID cannot be empty');
      return;
    }

    if (selectedTournament.participantCount >= selectedTournament.max_participants) {
      alert('Tournament is full!');
      return;
    }

    setJoining(true);

    try {
      // Check if already joined
      const { data: existing, error: checkError } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', selectedTournament.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Check error:', checkError);
        throw new Error('Failed to check participation status');
      }

      if (existing) {
        alert('You have already joined this tournament!');
        setJoining(false);
        return;
      }

      const entryFee = parseFloat(selectedTournament.entry_fee || 0);

      // Handle entry fee payment
      if (entryFee > 0) {
        const currentBalance = parseFloat(profile?.wallet_real || 0);
        
        if (currentBalance < entryFee) {
          alert(`Insufficient balance!\n\nRequired: ₹${entryFee.toFixed(2)}\nYour balance: ₹${currentBalance.toFixed(2)}`);
          setJoining(false);
          return;
        }

        // Deduct entry fee
        const newBalance = currentBalance - entryFee;
        
        const { error: walletError } = await supabase
          .from('users')
          .update({ wallet_real: newBalance })
          .eq('id', user.id);

        if (walletError) {
          console.error('Wallet error:', walletError);
          throw new Error('Failed to deduct entry fee');
        }

        // Record transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'tournament_entry',
            amount: -entryFee,
            status: 'completed',
            description: `Entry fee for ${selectedTournament.title}`,
            tournament_id: selectedTournament.id
          });

        if (transactionError) {
          console.error('Transaction error:', transactionError);
          // Refund on error
          await supabase
            .from('users')
            .update({ wallet_real: currentBalance })
            .eq('id', user.id);
          throw new Error('Failed to record transaction');
        }
      }

      // Prepare participant data with ALL required fields
      const participantData = {
        tournament_id: selectedTournament.id,
        user_id: user.id,
        in_game_name: joinData.in_game_name.trim(),
        in_game_id: joinData.in_game_id.trim(),
        payment_amount: entryFee,
        kills: 0,
        got_booyah: false,
        prize_won: 0,
        joined_at: new Date().toISOString()
      };

      console.log('Joining tournament with data:', participantData);

      // Join tournament
      const { error: insertError } = await supabase
        .from('tournament_participants')
        .insert(participantData);

      if (insertError) {
        console.error('Insert error:', insertError);
        
        // Refund entry fee if it was paid
        if (entryFee > 0) {
          const { data: currentUser } = await supabase
            .from('users')
            .select('wallet_real')
            .eq('id', user.id)
            .single();
          
          if (currentUser) {
            await supabase
              .from('users')
              .update({ wallet_real: parseFloat(currentUser.wallet_real) + entryFee })
              .eq('id', user.id);
          }
        }
        
        throw new Error(insertError.message || 'Failed to join tournament');
      }

      // INCREMENT TOURNAMENT JOIN STAT (NEW - FOR ACHIEVEMENTS)
      console.log('Updating tournament join stat...');
      const { error: statError } = await supabase
        .from('users')
        .update({
          stat_tournaments_joined: (profile?.stat_tournaments_joined || 0) + 1
        })
        .eq('id', user.id);

      if (statError) {
        console.error('Stat update error:', statError);
        // Don't fail the whole join if stat update fails
      } else {
        console.log('✅ Tournament join stat updated');
      }

      // Wait for trigger to assign seat number
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch participant data
      const { data: newParticipant } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', selectedTournament.id)
        .eq('user_id', user.id)
        .single();

      const seatNumber = newParticipant?.seat_number || 'pending';
      
      alert(`✅ Successfully Joined!\n\n` +
            `Tournament: ${selectedTournament.title}\n` +
            `Seat Number: ${seatNumber}\n` +
            `In-Game Name: ${joinData.in_game_name}\n` +
            `In-Game ID: ${joinData.in_game_id}\n` +
            (entryFee > 0 ? `Entry Fee Paid: ₹${entryFee.toFixed(2)}` : 'Free Entry'));
      
      setUserParticipation(newParticipant);
      setJoinData({ in_game_name: '', in_game_id: '' });
      closeModal();
      loadTournaments();

    } catch (error) {
      console.error('Join error:', error);
      alert('❌ Error joining tournament:\n\n' + error.message + '\n\nPlease try again or contact support.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Tournaments</h1>
          <p className="text-sm md:text-base text-discord-text">Join competitive tournaments and win prizes</p>
        </div>

        <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 overflow-x-auto pb-2">
          {['all', 'upcoming', 'live', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold capitalize whitespace-nowrap transition-all text-sm md:text-base ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-discord-dark text-discord-text hover:bg-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tournaments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaTrophy className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-lg md:text-xl text-white mb-2">No tournaments found</p>
              <p className="text-sm md:text-base text-discord-text">Check back later for new tournaments</p>
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => viewDetails(tournament)}
                className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 hover:border-purple-600 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    tournament.status === 'upcoming' ? 'bg-blue-600' :
                    tournament.status === 'live' ? 'bg-green-600 animate-pulse' :
                    'bg-gray-600'
                  } text-white`}>
                    {tournament.status}
                  </span>
                  <FaTrophy className="text-xl md:text-2xl text-yellow-400" />
                </div>

                <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-1">{tournament.title}</h3>
                <p className="text-xs md:text-sm text-discord-text mb-3 md:mb-4">{tournament.game}</p>

                {tournament.preset && (
                  <div className="bg-purple-600 bg-opacity-10 border border-purple-600 rounded-lg p-2 mb-3">
                    <p className="text-xs font-bold text-purple-400 truncate">{tournament.preset.name}</p>
                  </div>
                )}

                <div className="space-y-2 mb-3 md:mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-discord-text">Prize Pool</span>
                    <span className="text-sm md:text-base font-bold text-green-400">₹{parseFloat(tournament.prize_pool || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-discord-text">Entry Fee</span>
                    <span className="text-sm md:text-base font-bold text-white">₹{parseFloat(tournament.entry_fee || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-discord-text">Players</span>
                    <span className="text-sm md:text-base font-bold text-white">{tournament.participantCount}/{tournament.max_participants}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs md:text-sm text-discord-text mb-3">
                  <FaClock />
                  <span className="truncate">
                    {new Date(tournament.start_time).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewDetails(tournament);
                  }}
                  className="w-full px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FaInfoCircle />
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tournament Details Modal */}
      {showModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-discord-dark border-b border-gray-800 p-4 md:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white pr-4 line-clamp-2">{selectedTournament.title}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-800 rounded-lg transition-all flex-shrink-0">
                <FaTimes className="text-white text-lg md:text-xl" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm font-bold uppercase ${
                  selectedTournament.status === 'upcoming' ? 'bg-blue-600' :
                  selectedTournament.status === 'live' ? 'bg-green-600' :
                  'bg-gray-600'
                } text-white`}>
                  {selectedTournament.status}
                </span>
                <span className="text-sm md:text-base text-discord-text">{selectedTournament.game}</span>
              </div>

              {userParticipation && (
                <div className="bg-green-600 bg-opacity-10 border border-green-600 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-xl md:text-2xl text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-white text-sm md:text-base">✅ You're Registered!</p>
                      <p className="text-xs md:text-sm text-green-400">Seat #{userParticipation.seat_number}</p>
                      <p className="text-xs md:text-sm text-green-400">IGN: {userParticipation.in_game_name}</p>
                      <p className="text-xs md:text-sm text-green-400">UID: {userParticipation.in_game_id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ENHANCED PRIZE STRUCTURE */}
              {selectedTournament.preset && (
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    Prize Structure: {selectedTournament.preset.name}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-xs text-purple-200 mb-1">Entry Fee</p>
                      <p className="text-2xl font-bold text-white">₹{parseFloat(selectedTournament.entry_fee).toFixed(0)}</p>
                    </div>

                    {selectedTournament.preset.preset_number === 6 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 text-center border border-yellow-400">
                            <p className="text-2xl mb-1">🥇</p>
                            <p className="text-xs text-yellow-200">1st Place</p>
                            <p className="text-lg font-bold text-white">₹20</p>
                          </div>
                          <div className="bg-gray-400 bg-opacity-20 rounded-lg p-3 text-center border border-gray-400">
                            <p className="text-2xl mb-1">🥈</p>
                            <p className="text-xs text-gray-200">2nd Place</p>
                            <p className="text-lg font-bold text-white">₹15</p>
                          </div>
                          <div className="bg-orange-500 bg-opacity-20 rounded-lg p-3 text-center border border-orange-400">
                            <p className="text-2xl mb-1">🥉</p>
                            <p className="text-xs text-orange-200">3rd Place</p>
                            <p className="text-lg font-bold text-white">₹10</p>
                          </div>
                        </div>
                        <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCrown className="text-yellow-400" />
                            <p className="text-xs text-yellow-200">Booyah Winner Bonus</p>
                          </div>
                          <p className="text-xl font-bold text-white">+₹{selectedTournament.preset.booyah_reward}</p>
                          <p className="text-xs text-yellow-200 mt-1">Win Tag + Additional Prize</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedTournament.preset.per_kill_reward > 0 && (
                          <div className="bg-red-600 bg-opacity-20 rounded-lg p-3 border border-red-400">
                            <div className="flex items-center gap-2 mb-1">
                              <FaSkull className="text-red-400" />
                              <p className="text-xs text-red-200">Per Kill Reward</p>
                            </div>
                            <p className="text-xl font-bold text-white">₹{selectedTournament.preset.per_kill_reward} each</p>
                            <p className="text-xs text-red-200 mt-1">Example: 10 kills = ₹{selectedTournament.preset.per_kill_reward * 10}</p>
                          </div>
                        )}
                        
                        {selectedTournament.preset.booyah_reward > 0 && (
                          <div className="bg-yellow-600 bg-opacity-20 rounded-lg p-3 border border-yellow-400">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCrown className="text-yellow-400" />
                              <p className="text-xs text-yellow-200">Booyah Winner (Win Tag)</p>
                            </div>
                            <p className="text-xl font-bold text-white">₹{selectedTournament.preset.booyah_reward}</p>
                            <p className="text-xs text-yellow-200 mt-1">Only 1 person wins the match</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="bg-green-600 bg-opacity-20 rounded-lg p-3 border-2 border-green-400">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMoneyBillWave className="text-green-400" />
                        <p className="text-xs text-green-200">Total Prize Pool</p>
                      </div>
                      <p className="text-3xl font-bold text-white">₹{parseFloat(selectedTournament.prize_pool).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                  <FaUsers className="text-2xl text-blue-400 mb-2" />
                  <p className="text-xs md:text-sm text-discord-text mb-1">Players</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{selectedTournament.participantCount}/{selectedTournament.max_participants}</p>
                </div>
                <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                  <FaClock className="text-2xl text-purple-400 mb-2" />
                  <p className="text-xs md:text-sm text-discord-text mb-1">Start Time</p>
                  <p className="text-sm md:text-lg font-bold text-white">
                    {new Date(selectedTournament.start_time).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {selectedTournament.description && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm md:text-base">Description</h3>
                  <p className="text-xs md:text-sm text-discord-text">{selectedTournament.description}</p>
                </div>
              )}

              {selectedTournament.rules && (
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm md:text-base">Rules</h3>
                  <div className="bg-discord-darkest rounded-lg p-3 md:p-4">
                    <pre className="text-discord-text whitespace-pre-wrap text-xs md:text-sm">{selectedTournament.rules}</pre>
                  </div>
                </div>
              )}

              {userParticipation && selectedTournament.room_id && (
                <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-3 md:p-4">
                  <h3 className="font-bold text-white mb-3 text-sm md:text-base">🎮 Room Details</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Room ID</p>
                      <p className="font-mono font-bold text-white text-sm md:text-base break-all">{selectedTournament.room_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Password</p>
                      <p className="font-mono font-bold text-white text-sm md:text-base break-all">{selectedTournament.room_password}</p>
                    </div>
                  </div>
                </div>
              )}

              {!userParticipation && selectedTournament.status === 'upcoming' && (
                <div>
                  <h3 className="font-bold text-white mb-3 text-sm md:text-base">Join Tournament</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm text-discord-text mb-1">In-Game Name *</label>
                      <input
                        type="text"
                        value={joinData.in_game_name}
                        onChange={(e) => setJoinData({...joinData, in_game_name: e.target.value})}
                        placeholder="Your IGN"
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-discord-text mb-1">In-Game ID *</label>
                      <input
                        type="text"
                        value={joinData.in_game_id}
                        onChange={(e) => setJoinData({...joinData, in_game_id: e.target.value})}
                        placeholder="Your UID"
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm md:text-base"
                      />
                    </div>
                    <button
                      onClick={handleJoin}
                      disabled={joining || selectedTournament.participantCount >= selectedTournament.max_participants}
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all text-sm md:text-base flex items-center justify-center gap-2"
                    >
                      {joining ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Joining...
                        </>
                      ) : selectedTournament.participantCount >= selectedTournament.max_participants ? (
                        'Tournament Full'
                      ) : (
                        <>
                          <FaCheckCircle />
                          Join (₹{parseFloat(selectedTournament.entry_fee || 0).toFixed(0)})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedTournament.status === 'live' && !userParticipation && (
                <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 text-center">
                  <FaFire className="text-3xl text-red-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm md:text-base">Tournament is Live</p>
                  <p className="text-xs md:text-sm text-red-400">Registration closed</p>
                </div>
              )}

              {selectedTournament.status === 'completed' && (
                <div className="bg-gray-600 bg-opacity-10 border border-gray-600 rounded-lg p-4 text-center">
                  <FaTrophy className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm md:text-base">Tournament Completed</p>
                  <p className="text-xs md:text-sm text-discord-text">Results finalized</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
