/**
 * Ant Wealth Creation — Date Utilities
 * Robust local date handling and Indian date formatting (DD-MM-YYYY).
 * Avoids UTC shifting issues from toISOString().
 */

/**
 * Returns today's date in local calendar `YYYY-MM-DD` format.
 * Uses local getFullYear(), getMonth() + 1, and getDate().
 */
export function getTodayLocalDateString(dateInput: Date = new Date()): string {
  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, '0');
  const day = String(dateInput.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a YYYY-MM-DD or standard Date representation to Indian DD-MM-YYYY format.
 * e.g., '2026-10-28' -> '28-10-2026'
 */
export function formatIndianDate(dateStringOrObj: string | Date): string {
  if (!dateStringOrObj) return '';
  if (typeof dateStringOrObj === 'string') {
    const trimmed = dateStringOrObj.trim();
    // Check if already DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Standard YYYY-MM-DD
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (match) {
      const [, y, m, d] = match;
      return `${d}-${m}-${y}`;
    }
    // Fallback: parse via Date object if other format
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return trimmed;
  }

  // Date instance
  if (!isNaN(dateStringOrObj.getTime())) {
    const day = String(dateStringOrObj.getDate()).padStart(2, '0');
    const month = String(dateStringOrObj.getMonth() + 1).padStart(2, '0');
    const year = dateStringOrObj.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return '';
}

/**
 * Parses an Indian date DD-MM-YYYY string to standard YYYY-MM-DD (e.g. for HTML date input value).
 */
export function parseIndianDateToIsoDate(indianDateStr: string): string {
  if (!indianDateStr) return '';
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(indianDateStr.trim());
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return indianDateStr;
}
