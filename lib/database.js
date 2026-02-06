import { supabase } from './supabase';

// ====================================
// TOURNAMENT FUNCTIONS
// ====================================

export const getTournaments = async (filters = {}) => {
  try {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

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

export const getTournamentWithDetails = async (tournamentId, userId) => {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;

    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

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
        payment_verified: participation?.payment_verified || false
      }
    };
  } catch (error) {
    console.error('Error getting tournament:', error);
    return { success: false, error: error.message };
  }
};

export const createTournament = async (tournamentData) => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([tournamentData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating tournament:', error);
    return { success: false, error: error.message };
  }
};

export const updateTournament = async (tournamentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating tournament:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTournament = async (tournamentId) => {
  try {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return { success: false, error: error.message };
  }
};

export const joinTournament = async (tournamentId, userId, inGameName, voucherType = null) => {
  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    // Check if tournament is full
    if (tournament.participants_count >= tournament.max_participants) {
      return { success: false, error: 'Tournament is full' };
    }

    // Check if already joined
    const { data: existingParticipant } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      return { success: false, error: 'Already joined this tournament' };
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Calculate payment
    let paymentAmount = tournament.entry_fee;
    let voucherUsed = null;

    if (voucherType && tournament.entry_fee > 0) {
      const voucherField = `wallet_vouchers_${voucherType}`;
      if (userProfile[voucherField] > 0 && parseInt(voucherType) === tournament.entry_fee) {
        paymentAmount = 0;
        voucherUsed = voucherType;
      }
    }

    // Check balance
    if (paymentAmount > 0 && userProfile.wallet_real < paymentAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Get next seat number
    const { count } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    const seatNumber = (count || 0) + 1;

    // Create participant record
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

    // Deduct payment
    if (paymentAmount > 0) {
      await supabase
        .from('users')
        .update({ wallet_real: userProfile.wallet_real - paymentAmount })
        .eq('id', userId);
    } else if (voucherUsed) {
      const voucherField = `wallet_vouchers_${voucherUsed}`;
      await supabase
        .from('users')
        .update({ [voucherField]: userProfile[voucherField] - 1 })
        .eq('id', userId);
    }

    // Increment participant count
    await supabase.rpc('increment_participant_count', { tournament_id: tournamentId });

    return { success: true, data: participant };
  } catch (error) {
    console.error('Error joining tournament:', error);
    return { success: false, error: error.message };
  }
};

// ====================================
// USER FUNCTIONS
// ====================================

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: error.message };
  }
};

// ====================================
// PARTICIPANT FUNCTIONS
// ====================================

export const getTournamentParticipants = async (tournamentId) => {
  try {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        user:users(id, username, email)
      `)
      .eq('tournament_id', tournamentId)
      .order('seat_number', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return { success: false, error: error.message };
  }
};

export const giveWinTag = async (userId, tournamentId, prizeAmount) => {
  try {
    // Update participant record
    await supabase
      .from('tournament_participants')
      .update({
        win_tag_given: true,
        prize_won: prizeAmount,
      })
      .eq('user_id', userId)
      .eq('tournament_id', tournamentId);

    // Credit prize to user wallet
    const { data: user } = await supabase
      .from('users')
      .select('wallet_real, total_wins')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          wallet_real: user.wallet_real + prizeAmount,
          total_wins: (user.total_wins || 0) + 1,
        })
        .eq('id', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error giving win tag:', error);
    return { success: false, error: error.message };
  }
};
