/**
 * Currency formatting utilities for Chilean Peso (CLP)
 */

/**
 * Format a number as Chilean Peso currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    showSymbol?: boolean
    decimals?: number
  } = {}
): string {
  const { showSymbol = true, decimals = 0 } = options

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '$0' : '0'
  }

  const formatter = new Intl.NumberFormat('es-CL', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'CLP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return formatter.format(amount)
}

/**
 * Format a number as a compact currency (e.g., $1.5M, $200K)
 * @param amount - The amount to format
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0'
  }

  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })

  return formatter.format(amount)
}

/**
 * Parse a currency string to number
 * @param value - The currency string to parse (e.g., "$1.234.567" or "1234567")
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol and any non-numeric characters except comma and period
  const cleaned = value
    .replace(/\$/g, '')
    .replace(/\./g, '') // Remove thousand separators (dots in Chilean format)
    .replace(/,/g, '.') // Replace comma with period for decimals
    .trim()

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Calculate percentage of a value
 * @param amount - The base amount
 * @param percentage - The percentage to calculate
 * @returns The calculated amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return Math.round(amount * (percentage / 100))
}

/**
 * Calculate the percentage difference between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (positive or negative)
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

/**
 * Format a percentage value
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Add two currency amounts safely (avoiding floating point issues)
 * @param a - First amount
 * @param b - Second amount
 * @returns Sum of amounts
 */
export function addCurrency(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100
}

/**
 * Subtract two currency amounts safely
 * @param a - Amount to subtract from
 * @param b - Amount to subtract
 * @returns Difference
 */
export function subtractCurrency(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100
}

/**
 * Calculate total from an array of amounts
 * @param amounts - Array of numeric amounts
 * @returns Total sum
 */
export function sumCurrency(amounts: number[]): number {
  return amounts.reduce((sum, amount) => addCurrency(sum, amount), 0)
}
