/**
 * Tournament utility functions
 */

/**
 * Check if tournament has started based on start_time
 * @param {string} startTime - ISO datetime string
 * @returns {boolean}
 */
export function hasTournamentStarted(startTime) {
  if (!startTime) return false;
  const startDate = new Date(startTime);
  const now = new Date();
  return now >= startDate;
}

/**
 * Get effective tournament status (considers auto-switching)
 * @param {object} tournament - Tournament object with status and start_time
 * @returns {string} - 'upcoming', 'live', or 'completed'
 */
export function getEffectiveStatus(tournament) {
  if (!tournament) return 'upcoming';
  
  // If already completed, stay completed
  if (tournament.status === 'completed') {
    return 'completed';
  }
  
  // If manually set to live, stay live
  if (tournament.status === 'live') {
    return 'live';
  }
  
  // If upcoming and start time has passed, auto-switch to live
  if (tournament.status === 'upcoming' && hasTournamentStarted(tournament.start_time)) {
    return 'live';
  }
  
  return tournament.status;
}

/**
 * Check if user can join tournament
 * @param {object} tournament
 * @param {number} currentParticipants
 * @returns {object} - {canJoin: boolean, reason: string}
 */
export function canJoinTournament(tournament, currentParticipants) {
  if (!tournament) {
    return { canJoin: false, reason: 'Tournament not found' };
  }
  
  const effectiveStatus = getEffectiveStatus(tournament);
  
  // Cannot join if live or completed
  if (effectiveStatus === 'live') {
    return { canJoin: false, reason: 'Tournament has already started' };
  }
  
  if (effectiveStatus === 'completed') {
    return { canJoin: false, reason: 'Tournament has ended' };
  }
  
  // Check if tournament is full
  if (currentParticipants >= tournament.max_participants) {
    return { canJoin: false, reason: 'Tournament is full' };
  }
  
  return { canJoin: true, reason: '' };
}
