/**
 * Date formatting utilities for Chilean locale
 */
import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Parse a date string or Date object safely
 */
export function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null

  if (date instanceof Date) {
    return isValid(date) ? date : null
  }

  try {
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Format a date to a readable string
 * @param date - Date to format
 * @param formatStr - Format string (default: 'dd/MM/yyyy')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy'
): string {
  const parsed = parseDate(date)
  if (!parsed) return ''

  return format(parsed, formatStr, { locale: es })
}

/**
 * Format a date with time
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Format a date with full month name
 * @param date - Date to format
 * @returns Formatted date string (e.g., "15 de noviembre de 2025")
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  return formatDate(date, "d 'de' MMMM 'de' yyyy")
}

/**
 * Format time only
 * @param date - Date to format
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'HH:mm')
}

/**
 * Format a date relative to now (e.g., "hace 2 horas", "en 3 días")
 * @param date - Date to format
 * @param addSuffix - Whether to add "hace" or "en" prefix
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  addSuffix: boolean = true
): string {
  const parsed = parseDate(date)
  if (!parsed) return ''

  return formatDistanceToNow(parsed, { addSuffix, locale: es })
}

/**
 * Get a human-readable date description
 * @param date - Date to describe
 * @returns Description like "Hoy", "Ayer", "Mañana", or formatted date
 */
export function getDateDescription(date: string | Date | null | undefined): string {
  const parsed = parseDate(date)
  if (!parsed) return ''

  const today = new Date()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)

  if (isSameDay(parsed, today)) {
    return 'Hoy'
  }
  if (isSameDay(parsed, yesterday)) {
    return 'Ayer'
  }
  if (isSameDay(parsed, tomorrow)) {
    return 'Mañana'
  }

  return formatDate(parsed)
}

/**
 * Get the difference in days between two dates
 * @param dateA - First date
 * @param dateB - Second date (defaults to now)
 * @returns Number of days difference
 */
export function getDaysDifference(
  dateA: string | Date,
  dateB: string | Date = new Date()
): number {
  const parsedA = parseDate(dateA)
  const parsedB = parseDate(dateB)

  if (!parsedA || !parsedB) return 0

  return differenceInDays(parsedA, parsedB)
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPastDate(date: string | Date | null | undefined): boolean {
  const parsed = parseDate(date)
  if (!parsed) return false

  return isBefore(parsed, new Date())
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export function isFutureDate(date: string | Date | null | undefined): boolean {
  const parsed = parseDate(date)
  if (!parsed) return false

  return isAfter(parsed, new Date())
}

/**
 * Get date range helpers
 */
export const dateRanges = {
  today: () => ({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  }),
  thisMonth: () => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }),
  thisYear: () => ({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  }),
  lastMonth: () => {
    const lastMonth = addMonths(new Date(), -1)
    return {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
    }
  },
  last30Days: () => ({
    start: addDays(new Date(), -30),
    end: new Date(),
  }),
  last90Days: () => ({
    start: addDays(new Date(), -90),
    end: new Date(),
  }),
}

/**
 * Format a date for HTML date input (yyyy-MM-dd)
 * @param date - Date to format
 * @returns ISO date string for input value
 */
export function toInputDate(date: string | Date | null | undefined): string {
  return formatDate(date, 'yyyy-MM-dd')
}

/**
 * Format a datetime for HTML datetime-local input
 * @param date - Date to format
 * @returns ISO datetime string for input value
 */
export function toInputDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Get month name in Spanish
 * @param monthIndex - Month index (0-11)
 * @returns Month name in Spanish
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  return months[monthIndex] || ''
}

/**
 * Get short month name in Spanish
 * @param monthIndex - Month index (0-11)
 * @returns Short month name
 */
export function getMonthNameShort(monthIndex: number): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return months[monthIndex] || ''
}
