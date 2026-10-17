/**
 * Ant Wealth Creation — Currency and Number Formatters
 * Pure utility functions for Indian numbering formats (Lakhs, Crores).
 */

/**
 * Formats a number as Indian Rupee (INR) currency string.
 * Example: 1500000 -> "₹15,00,000"
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Formats a number in Indian shorthand notation (Lakhs, Crores).
 * Example: 25000000 -> "2.50 Cr", 500000 -> "5.00 L"
 */
export function formatIndianCompact(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    return `${sign}₹${(absAmount / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${absAmount.toFixed(0)}`;
}

/**
 * Formats a percentage value for display.
 * Example: 12.5 -> "12.50%"
 */
export function formatPercentage(rate: number, decimals = 2): string {
  if (isNaN(rate) || !isFinite(rate)) return '0%';
  return `${rate.toFixed(decimals)}%`;
}
