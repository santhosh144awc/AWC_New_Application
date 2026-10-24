/**
 * Ant Wealth Creation — Financial Domain Errors
 * 
 * Standard error class for parameter validation across all financial engines.
 */

export class FinanceValidationError extends Error {
  public readonly parameter: string;
  public readonly receivedValue: unknown;

  constructor(parameter: string, receivedValue: unknown, message: string) {
    super(`[FinanceValidationError] ${parameter}: ${message} (Received: ${String(receivedValue)})`);
    this.name = 'FinanceValidationError';
    this.parameter = parameter;
    this.receivedValue = receivedValue;
    Object.setPrototypeOf(this, FinanceValidationError.prototype);
  }
}

/**
 * Validates that a number is finite.
 */
export function assertFinite(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Must be a finite number');
  }
}

/**
 * Validates that a number is strictly positive (> 0).
 */
export function assertPositive(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new FinanceValidationError(name, value, 'Must be strictly positive (> 0)');
  }
}

/**
 * Validates that a number is non-negative (>= 0).
 */
export function assertPositiveOrZero(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new FinanceValidationError(name, value, 'Must be non-negative (>= 0)');
  }
}

/**
 * Validates that a number is finite and non-negative.
 * Parameter order compatible: (name, value) or (value, name).
 */
export function assertFiniteNonNegative(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Must be a finite number');
  }
  if (value < 0) {
    throw new FinanceValidationError(name, value, 'Must be non-negative (>= 0)');
  }
}

/**
 * Validates that a number is a positive integer.
 */
export function assertPositiveInteger(name: string | number, value?: string | number): void {
  const actualName = typeof name === 'string' ? name : (typeof value === 'string' ? value : 'value');
  const actualValue = typeof name === 'number' ? name : (value as number);

  if (typeof actualValue !== 'number' || !Number.isFinite(actualValue) || !Number.isInteger(actualValue)) {
    throw new FinanceValidationError(actualName, actualValue, 'Must be an integer');
  }
  if (actualValue <= 0) {
    throw new FinanceValidationError(actualName, actualValue, 'Must be strictly positive (> 0)');
  }
}

/**
 * Validates that an assumed investment return rate is within the standard consumer calculator contract.
 * Allowed range: 0 <= rate <= 100 (% per annum EAR).
 * Negative rates and rates above 100% are rejected to prevent nonsensical retail simulations.
 */
export function assertStandardInvestmentReturnPercent(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Return rate must be a finite number');
  }
  if (value < 0) {
    throw new FinanceValidationError(name, value, 'Assumed return rate cannot be negative in standard calculators (min 0%)');
  }
  if (value > 100) {
    throw new FinanceValidationError(name, value, 'Assumed return rate exceeds the standard calculator upper boundary (max 100%)');
  }
}

/**
 * Validates that an assumed inflation rate is within a sensible, non-negative consumer planning range.
 * Allowed range: 0 <= rate <= 100 (% per annum).
 * Distinct from investment return to maintain semantic clarity.
 */
export function assertInflationPercent(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Inflation rate must be a finite number');
  }
  if (value < 0) {
    throw new FinanceValidationError(name, value, 'Assumed inflation rate cannot be negative (min 0%)');
  }
  if (value > 100) {
    throw new FinanceValidationError(name, value, 'Assumed inflation rate cannot exceed 100%');
  }
}

/**
 * Validates that a quoted loan interest rate is within retail borrowing standards.
 * Allowed range: 0 <= rate <= 100 (% per annum nominal reducing balance).
 */
export function assertLoanInterestRatePercent(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Loan interest rate must be a finite number');
  }
  if (value < 0) {
    throw new FinanceValidationError(name, value, 'Loan interest rate cannot be negative (min 0%)');
  }
  if (value > 100) {
    throw new FinanceValidationError(name, value, 'Loan interest rate cannot exceed 100%');
  }
}

/**
 * Validates that an annual percentage rate is within a generic mathematical calculation domain.
 * Allowed range: -100 < rate <= 1000.
 *
 * NOTE: This broad validator is reserved for low-level mathematical converters (e.g. investmentRates.ts)
 * and theoretical scenarios. User-facing consumer engines must use assertStandardInvestmentReturnPercent,
 * assertInflationPercent, or assertLoanInterestRatePercent.
 */
export function assertValidRatePercent(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new FinanceValidationError(name, value, 'Rate must be a finite number');
  }
  if (value <= -100) {
    throw new FinanceValidationError(name, value, 'Rate cannot be less than or equal to -100%');
  }
  if (value > 1000) {
    throw new FinanceValidationError(name, value, 'Rate exceeds supported maximum calculation limit (1000%)');
  }
}

/**
 * Validates that an SIP contribution duration in whole integer years is within consumer calculator limits.
 * Allowed range: 1 <= years <= 40.
 */
export function assertValidSipDurationYears(name: string, value: number, minYears: number = 1, maxYears: number = 40): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new FinanceValidationError(name, value, 'SIP duration must be a whole number of years');
  }
  if (value < minYears || value > maxYears) {
    throw new FinanceValidationError(name, value, `SIP duration must be an integer between ${minYears} and ${maxYears} years.`);
  }
}

/**
 * Validates that a post-SIP holding period in whole integer years is within consumer planning limits.
 * Allowed range: 0 <= years <= 30.
 */
export function assertValidPostSipYears(name: string, value: number, minYears: number = 0, maxYears: number = 30): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new FinanceValidationError(name, value, 'Post-SIP holding period must be a whole number of years');
  }
  if (value < minYears || value > maxYears) {
    throw new FinanceValidationError(name, value, `Post-SIP holding period must be an integer between ${minYears} and ${maxYears} years.`);
  }
}
