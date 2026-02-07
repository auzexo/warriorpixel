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

export const getTransactions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
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
    return { success: true, data: tournament };
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
    return { success: false, error: error.message };
  }
};
