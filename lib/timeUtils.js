/**
 * Simple timezone utilities
 * Browser handles datetime-local conversion automatically
 */

/**
 * Convert datetime-local input to UTC ISO string for database
 * Browser automatically handles IST to UTC conversion
 * @param {string} dateTimeLocalValue - "2026-03-12T16:21"
 * @returns {string} - UTC ISO string
 */
export function parseISTToUTC(dateTimeLocalValue) {
  if (!dateTimeLocalValue) return '';
  
  // Browser automatically converts local time (IST) to UTC
  return new Date(dateTimeLocalValue).toISOString();
}

/**
 * Convert UTC ISO string to datetime-local format
 * @param {string} utcISOString - "2026-03-12T10:51:00.000Z"
 * @returns {string} - "2026-03-12T16:21" for datetime-local input
 */
export function formatUTCToISTLocal(utcISOString) {
  if (!utcISOString) return '';
  
  const date = new Date(utcISOString);
  
  // Get IST components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format UTC date to IST display string
 * @param {string} utcISOString - "2026-03-12T10:51:00.000Z"
 * @param {boolean} includeTime
 * @returns {string} - "12 Mar 2026, 4:21 PM IST"
 */
export function formatISTDate(utcISOString, includeTime = true) {
  if (!utcISOString) return '';
  
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  const formatted = new Date(utcISOString).toLocaleString('en-IN', options);
  return includeTime ? formatted + ' IST' : formatted;
}

/**
 * Check if tournament has started
 * @param {string} startTimeUTC
 * @returns {boolean}
 */
export function hasTournamentStarted(startTimeUTC) {
  if (!startTimeUTC) return false;
  const now = new Date();
  const start = new Date(startTimeUTC);
  return now >= start;
}
