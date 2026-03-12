/**
 * Timezone utilities for Indian Standard Time (IST)
 * IST is UTC+5:30
 */

/**
 * Convert UTC date to IST
 * @param {Date|string} utcDate - UTC date
 * @returns {Date} - IST date
 */
export function toIST(utcDate) {
  const date = new Date(utcDate);
  // IST is UTC+5:30 (330 minutes)
  const istOffset = 330; // minutes
  const utcTime = date.getTime();
  const istTime = utcTime + (istOffset * 60 * 1000);
  return new Date(istTime);
}

/**
 * Convert IST date to UTC for storage
 * @param {Date|string} istDate - IST date
 * @returns {Date} - UTC date
 */
export function toUTC(istDate) {
  const date = new Date(istDate);
  // IST is UTC+5:30 (330 minutes)
  const istOffset = 330; // minutes
  const istTime = date.getTime();
  const utcTime = istTime - (istOffset * 60 * 1000);
  return new Date(utcTime);
}

/**
 * Format date in IST timezone
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Include time in output
 * @returns {string} - Formatted date string
 */
export function formatISTDate(date, includeTime = true) {
  if (!date) return '';
  
  const istDate = toIST(date);
  
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
  
  return istDate.toLocaleString('en-IN', options) + (includeTime ? ' IST' : '');
}

/**
 * Format datetime for HTML datetime-local input (IST)
 * @param {Date|string} date
 * @returns {string} - Format: "2026-03-12T15:45"
 */
export function formatDateTimeLocal(date) {
  if (!date) return '';
  
  const istDate = toIST(date);
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse datetime-local input value (IST) to UTC for storage
 * @param {string} dateTimeLocalValue - Format: "2026-03-12T15:45"
 * @returns {string} - UTC ISO string
 */
export function parseDateTimeLocal(dateTimeLocalValue) {
  if (!dateTimeLocalValue) return '';
  
  // Parse as IST
  const [datePart, timePart] = dateTimeLocalValue.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  // Create date in IST
  const istDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  
  // Convert to UTC
  const utcDate = toUTC(istDate);
  return utcDate.toISOString();
}

/**
 * Check if tournament has started (IST time)
 * @param {string} startTime - UTC start time
 * @returns {boolean}
 */
export function hasTournamentStarted(startTime) {
  if (!startTime) return false;
  
  const now = new Date();
  const start = new Date(startTime);
  
  return now >= start;
}
