import { supabase } from './supabase';

export const getTournaments = async (filters = {}) => {
  try {
    let query = supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    if (filters.game && filters.game !== 'all') query = query.eq('game', filters.game);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
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
    if (!tournament) return { success: false, error: 'Tournament not found' };

    let participation = null;
    if (userId) {
      const { data } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();
      participation = data;
    }

    return {
      success: true,
      data: {
        ...tournament,
        is_participant: !!participation,
        user_seat_number: participation?.seat_number || null,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const joinTournament = async (tournamentId, userId, inGameName) => {
  try {
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
    const { data: userProfile } = await supabase.from('users').select('*').eq('id', userId).single();
    
    const paymentAmount = tournament.entry_fee;
    
    if (paymentAmount > 0 && userProfile.wallet_real < paymentAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { count } = await supabase.from('tournament_participants').select('*', { count: 'exact', head: true }).eq('tournament_id', tournamentId);
    const seatNumber = (count || 0) + 1;

    const { data, error } = await supabase.from('tournament_participants').insert({
      tournament_id: tournamentId,
      user_id: userId,
      in_game_name: inGameName,
      seat_number: seatNumber,
      payment_amount: paymentAmount,
      payment_verified: true,
    }).select().single();

    if (error) throw error;

    if (paymentAmount > 0) {
      await supabase.from('users').update({ wallet_real: userProfile.wallet_real - paymentAmount }).eq('id', userId);
    }

    await supabase.rpc('increment_participant_count', { tournament_id: tournamentId });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTournamentParticipants = async (tournamentId) => {
  try {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*, user:users(id, username, email)')
      .eq('tournament_id', tournamentId)
      .order('seat_number', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
