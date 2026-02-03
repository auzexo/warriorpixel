// lib/database.js
import { supabase } from './supabase';

// ============================================
// USER OPERATIONS
// ============================================

export const createUserProfile = async (userId, userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        username: userData.username,
        email: userData.email,
        display_name: userData.displayName || userData.username,
        wallet_real: 0,
        wallet_coins: 0,
        wallet_gems: 0,
        wallet_vouchers_20: 0,
        wallet_vouchers_30: 0,
        wallet_vouchers_50: 0,
        level: 1,
        xp: 0,
        achievement_points: 0,
        total_wins: 0,
        total_tournaments_played: 0,
        is_admin: false,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TOURNAMENT OPERATIONS
// ============================================

export const getTournaments = async (filters = {}) => {
  try {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('tournament_date', { ascending: true });

    if (filters.game && filters.game !== 'all') {
      query = query.eq('game', filters.game);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Hide room details from public view
    const sanitizedData = data.map(tournament => ({
      ...tournament,
      room_id: null,
      room_password: null
    }));

    return { success: true, data: sanitizedData };
  } catch (error) {
    console.error('Error getting tournaments:', error);
    return { success: false, error: error.message };
  }
};

export const getTournamentWithDetails = async (tournamentId, userId) => {
  try {
    // Get tournament
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) {
      console.error('Tournament fetch error:', error);
      throw error;
    }

    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    // Initialize default values
    let participation = null;
    let canSeeRoom = false;

    // Only check participation if userId is provided
    if (userId) {
      const { data: participationData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      participation = participationData;

      // Check if room details should be visible
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
    return { success: false, error: error.message || 'Failed to load tournament' };
  }
};

// ✅ UPDATED: Auto-assign seat number
export const joinTournament = async (tournamentId, userId, inGameName, voucherType = null) => {
  try {
    // Validate in-game name
    if (!inGameName || !inGameName.trim()) {
      return { success: false, error: 'In-game name is required' };
    }

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    // Check if already joined
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'Already joined this tournament' };
    }

    // Check if full
    if (tournament.participants_count >= tournament.max_participants) {
      return { success: false, error: 'Tournament is full' };
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let finalFee = tournament.entry_fee;

    // Check voucher
    if (voucherType && tournament.entry_fee > 0) {
      const voucherField = `wallet_vouchers_${voucherType}`;
      if (user[voucherField] > 0 && tournament.entry_fee === parseFloat(voucherType)) {
        finalFee = 0;
        const newVoucherCount = user[voucherField] - 1;
        await supabase
          .from('users')
          .update({ [voucherField]: newVoucherCount })
          .eq('id', userId);
      }
    }

    // Check balance if not using voucher
    if (finalFee > 0) {
      if (user.wallet_real < finalFee) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Deduct fee
      const newBalance = user.wallet_real - finalFee;
      await supabase
        .from('users')
        .update({ wallet_real: newBalance })
        .eq('id', userId);

      // Create transaction
      await createTransaction({
        user_id: userId,
        transaction_type: 'tournament_entry',
        amount: -finalFee,
        currency_type: 'real',
        balance_after: newBalance,
        description: `Tournament entry: ${tournament.name}`,
        tournament_id: tournamentId
      });
    }

    // ✅ AUTO-ASSIGN SEAT NUMBER
    // Get next available seat number
    const { data: existingSeats } = await supabase
      .from('tournament_participants')
      .select('seat_number')
      .eq('tournament_id', tournamentId)
      .order('seat_number', { ascending: true });

    let assignedSeat = 1;
    if (existingSeats && existingSeats.length > 0) {
      // Find first gap in seat numbers
      const usedSeats = existingSeats.map(p => p.seat_number).filter(s => s !== null);
      for (let i = 1; i <= tournament.max_participants; i++) {
        if (!usedSeats.includes(i)) {
          assignedSeat = i;
          break;
        }
      }
    }

    // Add participant with seat number
    const { data, error } = await supabase
      .from('tournament_participants')
      .insert([{
        tournament_id: tournamentId,
        user_id: userId,
        in_game_name: inGameName.trim(),
        seat_number: assignedSeat,
        payment_verified: true,
        payment_amount: finalFee,
        voucher_used: voucherType
      }])
      .select()
      .single();

    if (error) throw error;

    // Update count and user stats
    await supabase
      .from('tournaments')
      .update({ participants_count: tournament.participants_count + 1 })
      .eq('id', tournamentId);

    await supabase
      .from('users')
      .update({ total_tournaments_played: user.total_tournaments_played + 1 })
      .eq('id', userId);

    return { 
      success: true, 
      data: {
        ...data,
        seat_number: assignedSeat
      }
    };
  } catch (error) {
    console.error('Error joining tournament:', error);
    return { success: false, error: error.message };
  }
};

// ✅ NEW: Get tournament participants (for admin)
export const getTournamentParticipants = async (tournamentId) => {
  try {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        user:users(username, email)
      `)
      .eq('tournament_id', tournamentId)
      .order('seat_number', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting participants:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// WALLET OPERATIONS
// ============================================

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
    console.error('Error creating transaction:', error);
    return { success: false, error: error.message };
  }
};

export const getTransactions = async (userId, limitCount = 20) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, error: error.message };
  }
};

export const purchaseVoucher = async (userId, voucherType) => {
  try {
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('voucher_type', voucherType)
      .single();

    if (!voucher) {
      return { success: false, error: 'Voucher not found' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const purchasedField = `purchased_voucher_${voucherType}`;
    if (user[purchasedField]) {
      return { success: false, error: 'Voucher already purchased' };
    }

    if (user.wallet_gems < voucher.gem_cost) {
      return { success: false, error: 'Insufficient gems' };
    }

    const voucherField = `wallet_vouchers_${voucherType}`;
    const updates = {
      wallet_gems: user.wallet_gems - voucher.gem_cost,
      [voucherField]: user[voucherField] + 1,
      [purchasedField]: true
    };

    await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    await createTransaction({
      user_id: userId,
      transaction_type: 'voucher_purchase',
      amount: -voucher.gem_cost,
      currency_type: 'gems',
      balance_after: user.wallet_gems - voucher.gem_cost,
      description: `Purchased ${voucher.name}`
    });

    return { success: true };
  } catch (error) {
    console.error('Error purchasing voucher:', error);
    return { success: false, error: error.message };
  }
};

export const getVouchers = async () => {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting vouchers:', error);
    return { success: false, error: error.message };
  }
};

export const getShopProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('active', true)
      .order('price_real', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting shop products:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// WITHDRAWAL OPERATIONS
// ============================================

export const createWithdrawalRequest = async (userId, amount, upiId) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('wallet_real')
      .eq('id', userId)
      .single();

    if (user.wallet_real < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    if (amount < 10 || amount > 1800) {
      return { success: false, error: 'Amount must be between ₹10 and ₹1800' };
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([{
        user_id: userId,
        amount: amount,
        upi_id: upiId,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return { success: false, error: error.message };
  }
};

export const getWithdrawalRequests = async (userId = null) => {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*, user:users(username, email)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN OPERATIONS
// ============================================

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting users:', error);
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

export const giveWinTag = async (userId, tournamentId, prizeAmount) => {
  try {
    await supabase
      .from('tournament_participants')
      .update({ win_tag_given: true, prize_won: prizeAmount })
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId);

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    await supabase
      .from('users')
      .update({
        total_wins: user.total_wins + 1,
        wallet_real: user.wallet_real + prizeAmount
      })
      .eq('id', userId);

    await createTransaction({
      user_id: userId,
      transaction_type: 'tournament_win',
      amount: prizeAmount,
      currency_type: 'real',
      balance_after: user.wallet_real + prizeAmount,
      description: `Tournament prize`,
      tournament_id: tournamentId
    });

    return { success: true };
  } catch (error) {
    console.error('Error giving win tag:', error);
    return { success: false, error: error.message };
  }
};
