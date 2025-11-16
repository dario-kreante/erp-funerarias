/**
 * Chilean RUT (Rol Único Tributario) validation and formatting utilities
 */

/**
 * Clean a RUT string, removing dots and dashes
 * @param rut - RUT string to clean
 * @returns Cleaned RUT (only numbers and K)
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Calculate the verification digit for a RUT
 * @param rutNumber - RUT number without verification digit
 * @returns Verification digit (0-9 or K)
 */
export function calculateVerificationDigit(rutNumber: string): string {
  const rut = parseInt(rutNumber, 10)
  if (isNaN(rut) || rut < 1) return ''

  let sum = 0
  let multiplier = 2
  let rutString = rutNumber

  for (let i = rutString.length - 1; i >= 0; i--) {
    sum += parseInt(rutString[i], 10) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const digit = 11 - remainder

  if (digit === 11) return '0'
  if (digit === 10) return 'K'
  return digit.toString()
}

/**
 * Validate a Chilean RUT
 * @param rut - RUT to validate (with or without formatting)
 * @returns True if valid
 */
export function isValidRut(rut: string): boolean {
  if (!rut) return false

  const cleaned = cleanRut(rut)
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const verificationDigit = cleaned.slice(-1)

  const calculatedDigit = calculateVerificationDigit(body)

  return verificationDigit === calculatedDigit
}

/**
 * Format a RUT with dots and dash (e.g., 12.345.678-9)
 * @param rut - RUT to format
 * @returns Formatted RUT
 */
export function formatRut(rut: string): string {
  if (!rut) return ''

  const cleaned = cleanRut(rut)
  if (cleaned.length < 2) return cleaned

  const body = cleaned.slice(0, -1)
  const verificationDigit = cleaned.slice(-1)

  // Add dots to body
  let formatted = ''
  let count = 0

  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted
    count++
    if (count === 3 && i > 0) {
      formatted = '.' + formatted
      count = 0
    }
  }

  return `${formatted}-${verificationDigit}`
}

/**
 * Parse and format RUT input (for use in form inputs)
 * @param value - Current input value
 * @returns Formatted RUT
 */
export function formatRutInput(value: string): string {
  if (!value) return ''

  const cleaned = cleanRut(value)
  if (cleaned.length === 0) return ''

  // Don't format until we have enough characters
  if (cleaned.length <= 1) return cleaned

  return formatRut(cleaned)
}

/**
 * Mask a RUT for display (e.g., 12.***.**8-9)
 * @param rut - RUT to mask
 * @returns Masked RUT
 */
export function maskRut(rut: string): string {
  const formatted = formatRut(rut)
  if (formatted.length < 5) return formatted

  const parts = formatted.split('-')
  if (parts.length !== 2) return formatted

  const body = parts[0]
  const digit = parts[1]

  // Mask middle digits
  const bodyParts = body.split('.')
  if (bodyParts.length === 3) {
    return `${bodyParts[0]}.***.***-${digit}`
  } else if (bodyParts.length === 2) {
    return `${bodyParts[0]}.***-${digit}`
  }

  return formatted
}

/**
 * Validate RUT format for forms
 * @param rut - RUT to validate
 * @returns Error message or null if valid
 */
export function validateRutField(rut: string): string | null {
  if (!rut) return 'El RUT es requerido'

  const cleaned = cleanRut(rut)

  if (cleaned.length < 8) {
    return 'El RUT debe tener al menos 8 caracteres'
  }

  if (cleaned.length > 9) {
    return 'El RUT no puede tener más de 9 caracteres'
  }

  if (!isValidRut(cleaned)) {
    return 'El RUT ingresado no es válido'
  }

  return null
}
