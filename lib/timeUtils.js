/**
 * Timezone utilities for Indian Standard Time (IST)
 * IST is UTC+5:30
 */

/**
 * Parse datetime-local input (treat as IST) and convert to UTC ISO string
 * @param {string} dateTimeLocalValue - "2026-03-12T15:45"
 * @returns {string} - UTC ISO string for database
 */
export function parseISTToUTC(dateTimeLocalValue) {
  if (!dateTimeLocalValue) return '';
  
  // Create a date object from the input (browser treats as local time)
  const inputDate = new Date(dateTimeLocalValue);
  
  // Subtract IST offset (5:30 = 330 minutes) to get UTC
  const utcTime = inputDate.getTime() - (330 * 60 * 1000);
  const utcDate = new Date(utcTime);
  
  return utcDate.toISOString();
}

/**
 * Convert UTC ISO string to datetime-local format (IST)
 * @param {string} utcISOString - "2026-03-12T10:15:00.000Z"
 * @returns {string} - "2026-03-12T15:45" for datetime-local input
 */
export function formatUTCToISTLocal(utcISOString) {
  if (!utcISOString) return '';
  
  const utcDate = new Date(utcISOString);
  
  // Add IST offset (5:30 = 330 minutes)
  const istTime = utcDate.getTime() + (330 * 60 * 1000);
  const istDate = new Date(istTime);
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format UTC date to IST display string
 * @param {string} utcISOString
 * @param {boolean} includeTime
 * @returns {string} - "12 Mar 2026, 3:45 PM IST"
 */
export function formatISTDate(utcISOString, includeTime = true) {
  if (!utcISOString) return '';
  
  const utcDate = new Date(utcISOString);
  
  // Add IST offset
  const istTime = utcDate.getTime() + (330 * 60 * 1000);
  const istDate = new Date(istTime);
  
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC' // Use UTC since we already added offset
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  const formatted = istDate.toLocaleString('en-IN', options);
  return includeTime ? formatted + ' IST' : formatted;
}

/**
 * Check if tournament has started (compares UTC times)
 * @param {string} startTimeUTC - UTC ISO string
 * @returns {boolean}
 */
export function hasTournamentStarted(startTimeUTC) {
  if (!startTimeUTC) return false;
  const now = new Date();
  const start = new Date(startTimeUTC);
  return now >= start;
}

/**
 * Get current time in IST format for datetime-local
 * @returns {string} - "2026-03-12T15:45"
 */
export function getCurrentISTLocal() {
  const now = new Date();
  const istTime = now.getTime() + (330 * 60 * 1000);
  const istDate = new Date(istTime);
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
