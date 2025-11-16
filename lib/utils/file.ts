/**
 * File handling utilities
 */

/**
 * Format file size to human readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns File extension without dot (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

/**
 * Get file name without extension
 * @param filename - The filename
 * @returns Filename without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length > 1) {
    parts.pop()
  }
  return parts.join('.')
}

/**
 * Validate file type against allowed types
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types or extensions
 * @returns True if file type is allowed
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const extension = getFileExtension(file.name)
  const mimeType = file.type.toLowerCase()

  return allowedTypes.some((type) => {
    const lowerType = type.toLowerCase()
    // Check if it's a MIME type
    if (lowerType.includes('/')) {
      return mimeType === lowerType || mimeType.startsWith(lowerType.replace('*', ''))
    }
    // Check if it's an extension
    return extension === lowerType.replace('.', '')
  })
}

/**
 * Validate file size
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns True if file size is within limit
 */
export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

/**
 * Common file type groups
 */
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  pdf: ['application/pdf'],
  spreadsheets: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
}

/**
 * Common file size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  small: 1 * 1024 * 1024, // 1 MB
  medium: 5 * 1024 * 1024, // 5 MB
  large: 10 * 1024 * 1024, // 10 MB
  xlarge: 50 * 1024 * 1024, // 50 MB
}

/**
 * Generate a unique filename with timestamp
 * @param originalName - Original filename
 * @returns New filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const extension = getFileExtension(originalName)
  const baseName = getFileNameWithoutExtension(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  return `${baseName}_${timestamp}_${random}.${extension}`
}

/**
 * Sanitize filename for safe storage
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/__+/g, '_') // Remove multiple underscores
    .toLowerCase()
}

/**
 * Create a storage path for a file
 * @param funeralHomeId - The funeral home ID
 * @param entityType - Type of entity (service, expense, etc.)
 * @param entityId - ID of the entity
 * @param filename - The filename
 * @returns Storage path
 */
export function createStoragePath(
  funeralHomeId: string,
  entityType: string,
  entityId: string,
  filename: string
): string {
  const sanitized = sanitizeFileName(filename)
  const unique = generateUniqueFileName(sanitized)
  return `${funeralHomeId}/${entityType}/${entityId}/${unique}`
}

/**
 * Get MIME type icon name for a file
 * @param mimeType - The MIME type
 * @returns Icon identifier
 */
export function getFileIconType(mimeType: string): 'pdf' | 'image' | 'document' | 'spreadsheet' | 'file' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return 'spreadsheet'
  }
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  return 'file'
}

/**
 * Check if a file is an image
 * @param file - The file or MIME type
 * @returns True if it's an image
 */
export function isImageFile(file: File | string): boolean {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType.startsWith('image/')
}

/**
 * Check if a file is a PDF
 * @param file - The file or MIME type
 * @returns True if it's a PDF
 */
export function isPdfFile(file: File | string): boolean {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType === 'application/pdf'
}

/**
 * Convert File to base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Download a file from a URL
 * @param url - The file URL
 * @param filename - The name to save the file as
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
