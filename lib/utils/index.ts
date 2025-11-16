// Class name utilities
export { cx } from './cx'

// Currency utilities
export {
  formatCurrency,
  formatCurrencyCompact,
  parseCurrency,
  calculatePercentage,
  percentageChange,
  formatPercentage,
  addCurrency,
  subtractCurrency,
  sumCurrency,
} from './currency'

// Date utilities
export {
  parseDate,
  formatDate,
  formatDateTime,
  formatDateLong,
  formatTime,
  formatRelativeTime,
  getDateDescription,
  getDaysDifference,
  isPastDate,
  isFutureDate,
  dateRanges,
  toInputDate,
  toInputDateTime,
  getMonthName,
  getMonthNameShort,
} from './date'

// Error utilities
export {
  getErrorMessage,
  createError,
  isAuthError,
  isValidationError,
  extractZodErrors,
  logError,
  success,
  failure,
} from './errors'
export type { AppError, ActionResult } from './errors'

// File utilities
export {
  formatFileSize,
  getFileExtension,
  getFileNameWithoutExtension,
  isValidFileType,
  isValidFileSize,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  generateUniqueFileName,
  sanitizeFileName,
  createStoragePath,
  getFileIconType,
  isImageFile,
  isPdfFile,
  fileToBase64,
  downloadFile,
} from './file'

// RUT (Chilean ID) utilities
export {
  cleanRut,
  calculateVerificationDigit,
  isValidRut,
  formatRut,
  formatRutInput,
  maskRut,
  validateRutField,
} from './rut'
