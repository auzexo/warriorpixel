import { supabase } from './supabase';
import { hasTournamentStarted } from './timeUtils';

/**
 * Auto-update tournament status based on current time
 * Checks if tournaments have started and updates status from upcoming -> live
 * @returns {Promise<void>}
 */
export async function updateTournamentStatuses() {
  try {
    // Get all upcoming tournaments
    const { data: upcomingTournaments, error } = await supabase
      .from('tournaments')
      .select('id, start_time, status')
      .eq('status', 'upcoming');

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

    if (!upcomingTournaments || upcomingTournaments.length === 0) {
      return;
    }

    // Check each tournament and update if started
    const tournamentsToUpdate = upcomingTournaments.filter(tournament => 
      hasTournamentStarted(tournament.start_time)
    );

    if (tournamentsToUpdate.length === 0) {
      return;
    }

    console.log(`Auto-updating ${tournamentsToUpdate.length} tournaments to LIVE status`);

    // Update all started tournaments to live
    const updatePromises = tournamentsToUpdate.map(tournament =>
      supabase
        .from('tournaments')
        .update({ status: 'live' })
        .eq('id', tournament.id)
    );

    await Promise.all(updatePromises);

    console.log('✅ Tournament statuses updated successfully');
  } catch (error) {
    console.error('Error updating tournament statuses:', error);
  }
}

/**
 * Update a single tournament status if needed
 * @param {string} tournamentId
 * @returns {Promise<boolean>} - Returns true if status was updated
 */
export async function updateSingleTournamentStatus(tournamentId) {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('id, start_time, status')
      .eq('id', tournamentId)
      .single();

    if (error || !tournament) {
      console.error('Error fetching tournament:', error);
      return false;
    }

    // Only update if currently upcoming and has started
    if (tournament.status === 'upcoming' && hasTournamentStarted(tournament.start_time)) {
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ status: 'live' })
        .eq('id', tournamentId);

      if (updateError) {
        console.error('Error updating status:', updateError);
        return false;
      }

      console.log(`✅ Tournament ${tournamentId} auto-updated to LIVE`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in updateSingleTournamentStatus:', error);
    return false;
  }
}
