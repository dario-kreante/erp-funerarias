/**
 * Error handling utilities
 */

export interface AppError {
  message: string
  code?: string
  details?: unknown
}

/**
 * Known error codes and their user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Supabase Auth errors
  'invalid_credentials': 'Correo o contraseña incorrectos',
  'email_not_confirmed': 'Por favor confirma tu correo electrónico',
  'user_not_found': 'Usuario no encontrado',
  'weak_password': 'La contraseña debe tener al menos 8 caracteres',
  'email_taken': 'Ya existe una cuenta con este correo',
  'invalid_email': 'El correo electrónico no es válido',
  'session_expired': 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',

  // Database errors
  '23505': 'Ya existe un registro con estos datos',
  '23503': 'No se puede eliminar porque hay registros relacionados',
  '23502': 'Faltan campos obligatorios',
  '42501': 'No tienes permisos para realizar esta acción',
  '42P01': 'Error de configuración del sistema',

  // Custom application errors
  'UNAUTHORIZED': 'No tienes autorización para realizar esta acción',
  'NOT_FOUND': 'El recurso solicitado no fue encontrado',
  'VALIDATION_ERROR': 'Los datos proporcionados no son válidos',
  'BRANCH_REQUIRED': 'Debes seleccionar una sucursal',
  'SERVICE_LOCKED': 'Este servicio está cerrado y no puede ser modificado',
  'INSUFFICIENT_BALANCE': 'El monto excede el saldo pendiente',

  // Generic errors
  'NETWORK_ERROR': 'Error de conexión. Verifica tu internet',
  'SERVER_ERROR': 'Error del servidor. Intenta más tarde',
  'UNKNOWN_ERROR': 'Ha ocurrido un error inesperado',
}

/**
 * Get a user-friendly error message from an error
 * @param error - The error to process
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES['UNKNOWN_ERROR']

  // String error
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error
  }

  // Error object with code
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>

    // Check for error code
    if (errorObj.code && typeof errorObj.code === 'string') {
      if (ERROR_MESSAGES[errorObj.code]) {
        return ERROR_MESSAGES[errorObj.code]
      }
    }

    // Check for Supabase error format
    if (errorObj.message && typeof errorObj.message === 'string') {
      // Check if it's a known error message key
      const messageKey = errorObj.message.toLowerCase().replace(/ /g, '_')
      if (ERROR_MESSAGES[messageKey]) {
        return ERROR_MESSAGES[messageKey]
      }
      return errorObj.message
    }

    // Check for nested error
    if (errorObj.error && typeof errorObj.error === 'object') {
      return getErrorMessage(errorObj.error)
    }
  }

  // Error instance
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES['UNKNOWN_ERROR']
  }

  return ERROR_MESSAGES['UNKNOWN_ERROR']
}

/**
 * Create a standardized app error
 * @param code - Error code
 * @param message - Optional custom message
 * @param details - Optional error details
 * @returns AppError object
 */
export function createError(code: string, message?: string, details?: unknown): AppError {
  return {
    code,
    message: message || ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'],
    details,
  }
}

/**
 * Check if an error is an authentication error
 * @param error - The error to check
 * @returns True if it's an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false

  const authCodes = [
    'invalid_credentials',
    'email_not_confirmed',
    'session_expired',
    'UNAUTHORIZED',
    '42501',
  ]

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>
    if (errorObj.code && typeof errorObj.code === 'string') {
      return authCodes.includes(errorObj.code)
    }
  }

  return false
}

/**
 * Check if an error is a validation error
 * @param error - The error to check
 * @returns True if it's a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (!error) return false

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>
    return (
      errorObj.code === 'VALIDATION_ERROR' ||
      errorObj.code === '23502' ||
      (errorObj.name === 'ZodError') ||
      (Array.isArray(errorObj.issues))
    )
  }

  return false
}

/**
 * Extract validation errors from Zod error
 * @param error - Zod error object
 * @returns Object with field names as keys and error messages as values
 */
export function extractZodErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object') return {}

  const errorObj = error as Record<string, unknown>

  if (!Array.isArray(errorObj.issues)) return {}

  const errors: Record<string, string> = {}

  for (const issue of errorObj.issues) {
    if (typeof issue === 'object' && issue !== null) {
      const issueObj = issue as Record<string, unknown>
      const path = Array.isArray(issueObj.path) ? issueObj.path.join('.') : ''
      const message = typeof issueObj.message === 'string' ? issueObj.message : 'Campo inválido'

      if (path) {
        errors[path] = message
      }
    }
  }

  return errors
}

/**
 * Log error to console in development
 * @param context - Where the error occurred
 * @param error - The error object
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error)
  }
}

/**
 * Action result type for server actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AppError }

/**
 * Create a successful action result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Create a failed action result
 */
export function failure(code: string, message?: string, details?: unknown): ActionResult<never> {
  return { success: false, error: createError(code, message, details) }
}
