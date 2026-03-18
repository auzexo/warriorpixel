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
 * MANUAL CONVERSION - Guaranteed to work across all browsers/devices
 * @param {string} utcISOString - "2026-03-12T10:51:00.000Z"
 * @param {boolean} includeTime
 * @returns {string} - "12 Mar 2026, 4:21 pm IST"
 */
export function formatISTDate(utcISOString, includeTime = true) {
  if (!utcISOString) return '';
  
  // Parse UTC date
  const utcDate = new Date(utcISOString);
  
  // Manually add IST offset (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(utcDate.getTime() + istOffset);
  
  // Format the date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = istTime.getUTCDate();
  const month = months[istTime.getUTCMonth()];
  const year = istTime.getUTCFullYear();
  
  if (!includeTime) {
    return `${day} ${month} ${year}`;
  }
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm} IST`;
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
