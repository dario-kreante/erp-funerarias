'use client'

import { useRef, useState, ChangeEvent, DragEvent } from 'react'
import { cx } from '@/lib/utils/cx'
import { UploadCloud01Icon, FileIcon, XCloseIcon } from '@untitledui/icons-react'
import { Button } from './Button'

export interface FileUploadProps {
  label?: string
  description?: string
  errorMessage?: string
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  onFilesSelected: (files: File[]) => void
  className?: string
  required?: boolean
}

export function FileUpload({
  label,
  description,
  errorMessage,
  accept,
  multiple = false,
  maxSize,
  onFilesSelected,
  className,
  required
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (files: File[]): boolean => {
    if (maxSize) {
      const oversizedFile = files.find(file => file.size > maxSize)
      if (oversizedFile) {
        setError(`El archivo ${oversizedFile.name} excede el tamaño máximo de ${formatFileSize(maxSize)}`)
        return false
      }
    }
    setError(null)
    return true
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    if (!validateFiles(fileArray)) return

    setSelectedFiles(multiple ? [...selectedFiles, ...fileArray] : fileArray)
    onFilesSelected(fileArray)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
      )}
      {description && <p className="text-xs text-gray-500">{description}</p>}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cx(
          'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors',
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
          (errorMessage || error) && 'border-error-500 bg-error-50'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud01Icon className="mb-3 h-10 w-10 text-gray-400" />
        <p className="mb-1 text-sm text-gray-700">
          <span className="font-semibold text-primary-600">Haz clic para subir</span> o arrastra archivos
        </p>
        {accept && <p className="text-xs text-gray-500">Formatos aceptados: {accept}</p>}
        {maxSize && <p className="text-xs text-gray-500">Tamaño máximo: {formatFileSize(maxSize)}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-2 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XCloseIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(errorMessage || error) && (
        <p className="text-xs text-error-600">{errorMessage || error}</p>
      )}
    </div>
  )
}
