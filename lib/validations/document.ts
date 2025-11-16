import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  documentTypeEnum,
  requiredStringSchema,
} from './common'

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const documentSchema = z.object({
  service_id: optionalUuidSchema,
  mortuary_quota_id: optionalUuidSchema,
  document_type: documentTypeEnum,
  nombre_archivo: requiredStringSchema.min(1, 'El nombre del archivo es requerido'),
  url_archivo: requiredStringSchema.url('URL de archivo inválida'),
  tamano_archivo: z.number().int().max(MAX_FILE_SIZE, 'El archivo excede el tamaño máximo de 10MB').optional().nullable(),
  tipo_mime: z.string().refine(
    (val) => allowedMimeTypes.includes(val),
    'Tipo de archivo no permitido'
  ).optional().nullable(),
  uploaded_by: optionalUuidSchema,
})

export type DocumentInput = z.infer<typeof documentSchema>

// Schema for uploading a document
export const uploadDocumentSchema = z.object({
  service_id: optionalUuidSchema,
  mortuary_quota_id: optionalUuidSchema,
  document_type: documentTypeEnum,
  file: z.object({
    name: requiredStringSchema,
    size: z.number().max(MAX_FILE_SIZE, 'El archivo excede el tamaño máximo de 10MB'),
    type: z.string().refine(
      (val) => allowedMimeTypes.includes(val),
      'Tipo de archivo no permitido'
    ),
  }),
}).refine(
  (data) => data.service_id != null || data.mortuary_quota_id != null,
  {
    message: 'Debe especificar un servicio o cuota mortuoria',
    path: ['service_id'],
  }
)

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

// Schema for deleting document
export const deleteDocumentSchema = z.object({
  document_id: uuidSchema,
})

export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>

// Schema for document filters
export const documentFilterSchema = z.object({
  service_id: uuidSchema.optional(),
  mortuary_quota_id: uuidSchema.optional(),
  document_type: documentTypeEnum.optional(),
})

export type DocumentFilter = z.infer<typeof documentFilterSchema>
