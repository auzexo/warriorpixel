// lib/timeUtils.js
// Root IST timezone utility — used across all pages
// Handles all Supabase timestamp formats safely

/**
 * Normalize any Supabase timestamp to a Date object
 * Supabase returns: "2026-05-13 23:30:08.903814+00" (space, microseconds, +00)
 * Some browsers fail to parse this — this function normalizes it first
 */
const toDate = (utcString) => {
  if (!utcString) return null;
  try {
    const s = utcString.toString()
      .replace(' ', 'T')           // space → T separator
      .replace('+00:00', 'Z')      // +00:00 → Z
      .replace('+00', 'Z')         // +00 → Z
      .replace(/(\.\d{3})\d+/, '$1'); // trim microseconds to ms
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Convert UTC timestamp to IST formatted string
 * Uses manual UTC+5:30 offset — works on ALL devices including old Android
 * Output: "14 May 2026, 5:00 am IST"
 */
export const formatISTDate = (utcString, includeTime = true) => {
  const date = toDate(utcString);
  if (!date) return 'Unknown';
  try {
    // Manually add IST offset (5h 30m = 19800000ms)
    const ist = new Date(date.getTime() + 19800000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = ist.getUTCDate();
    const month = months[ist.getUTCMonth()];
    const year = ist.getUTCFullYear();
    if (!includeTime) return `${day} ${month} ${year}`;
    const h24 = ist.getUTCHours();
    const mins = String(ist.getUTCMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'pm' : 'am';
    const h12 = h24 % 12 || 12;
    return `${day} ${month} ${year}, ${h12}:${mins} ${ampm} IST`;
  } catch {
    return 'Unknown';
  }
};

/**
 * Short alias — same as formatISTDate with time
 */
export const toIST = formatISTDate;

/**
 * Get time remaining until a future date
 * Output: "45d 3h left" or "2h 15m left" or "Ended"
 */
export const getTimeLeft = (utcString) => {
  const date = toDate(utcString);
  if (!date) return '';
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
};

/**
 * Format IST date only (no time)
 */
export const formatISTDateOnly = (utcString) => formatISTDate(utcString, false);

/**
 * Check if today (IST) is same as a given UTC date
 */
export const isToday = (utcString) => {
  const date = toDate(utcString);
  if (!date) return false;
  const istDate = new Date(date.getTime() + 19800000);
  const nowIST = new Date(Date.now() + 19800000);
  return istDate.getUTCFullYear() === nowIST.getUTCFullYear() &&
    istDate.getUTCMonth() === nowIST.getUTCMonth() &&
    istDate.getUTCDate() === nowIST.getUTCDate();
};
/**
 * Convert IST datetime-local input → UTC ISO string
 * Used in tournament create/edit forms
 */
export const parseISTToUTC = (istLocalString) => {
  if (!istLocalString) return null;
  // datetime-local value is "2026-05-18T09:01" — treat as IST, convert to UTC
  const d = new Date(istLocalString + ':00');
  // Subtract 5h 30m to go from IST to UTC
  d.setMinutes(d.getMinutes() - 330);
  return d.toISOString();
};

/**
 * Format UTC timestamp → IST datetime-local input value
 * Used to pre-fill datetime inputs with IST time
 */
export const formatUTCToISTLocal = (utcString) => {
  if (!utcString) return '';
  const istMs = new Date(utcString).getTime() + 19800000; // +5h30m
  return new Date(istMs).toISOString().slice(0, 16);
};

/**
 * Check if a tournament's start time has already passed
 */
export const hasTournamentStarted = (startTime) => {
  if (!startTime) return false;
  return new Date(startTime) <= new Date();
};
