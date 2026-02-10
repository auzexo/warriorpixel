import { supabase } from './supabase';

// ==========================================
// TOURNAMENT FUNCTIONS
// ==========================================

export const getTournaments = async (filters = {}) => {
  try {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('start_time', { ascending: true });

    if (filters.game && filters.game !== 'all') {
      query = query.eq('game', filters.game);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return { success: false, error: error.message };
  }
};

export const getTournamentById = async (tournamentId, userId = null) => {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;
    if (!tournament) return { success: false, error: 'Tournament not found' };

    let participation = null;
    let canSeeRoom = false;

    if (userId) {
      const { data: participationData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      participation = participationData;

      if (participation && participation.payment_verified) {
        const now = new Date();
        const roomVisibleTime = tournament.room_visible_at 
          ? new Date(tournament.room_visible_at) 
          : null;
        canSeeRoom = roomVisibleTime && now >= roomVisibleTime;
      }
    }

    return {
      success: true,
      data: {
        ...tournament,
        room_id: canSeeRoom ? tournament.room_id : null,
        room_password: canSeeRoom ? tournament.room_password : null,
        is_participant: !!participation,
        can_see_room: canSeeRoom,
        user_seat_number: participation?.seat_number || null,
        user_in_game_name: participation?.in_game_name || null,
        payment_verified: participation?.payment_verified || false,
      }
    };
  } catch (error) {
    console.error('Error getting tournament:', error);
    return { success: false, error: error.message };
  }
};

export const joinTournament = async (tournamentId, userId, inGameName, voucherType = null) => {
  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    if (tournament.participants_count >= tournament.max_participants) {
      return { success: false, error: 'Tournament is full' };
    }

    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'Already joined this tournament' };
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let paymentAmount = tournament.entry_fee;
    let voucherUsed = null;

    if (voucherType && tournament.entry_fee > 0) {
      const voucherField = `wallet_vouchers_${voucherType}`;
      if (userProfile[voucherField] > 0 && parseInt(voucherType) === tournament.entry_fee) {
        paymentAmount = 0;
        voucherUsed = voucherType;
      }
    }

    if (paymentAmount > 0 && userProfile.wallet_real < paymentAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { count } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    const seatNumber = (count || 0) + 1;

    const { data: participant, error: participantError } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        in_game_name: inGameName,
        seat_number: seatNumber,
        payment_amount: paymentAmount,
        payment_verified: true,
        voucher_used: voucherUsed,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    if (paymentAmount > 0) {
      await supabase
        .from('users')
        .update({ wallet_real: userProfile.wallet_real - paymentAmount })
        .eq('id', userId);

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'tournament_entry',
        amount: -paymentAmount,
        currency: 'real',
        description: `Joined tournament: ${tournament.name}`,
        reference_id: tournamentId,
      });
    } else if (voucherUsed) {
      const voucherField = `wallet_vouchers_${voucherUsed}`;
      await supabase
        .from('users')
        .update({ [voucherField]: userProfile[voucherField] - 1 })
        .eq('id', userId);

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'tournament_entry',
        amount: -parseInt(voucherUsed),
        currency: `voucher_${voucherUsed}`,
        description: `Joined tournament: ${tournament.name} (Voucher)`,
        reference_id: tournamentId,
      });
    }

    await supabase
      .from('tournaments')
      .update({ participants_count: tournament.participants_count + 1 })
      .eq('id', tournamentId);

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Tournament Joined!',
      message: `Successfully joined ${tournament.name}. Seat #${seatNumber}`,
      type: 'tournament',
    });

    return { success: true, data: participant };
  } catch (error) {
    console.error('Error joining tournament:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// WALLET FUNCTIONS
// ==========================================

export const getTransactions = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: error.message };
  }
};
