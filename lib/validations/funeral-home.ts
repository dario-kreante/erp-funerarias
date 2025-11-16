import { z } from 'zod'
import {
  rutSchema,
  optionalStringSchema,
  requiredStringSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  optionalDateSchema,
} from './common'

export const funeralHomeSchema = z.object({
  razon_social: requiredStringSchema.min(3, 'La razón social debe tener al menos 3 caracteres'),
  nombre_fantasia: optionalStringSchema,
  rut: rutSchema,
  business_line: optionalStringSchema,
  address: optionalStringSchema,
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  sanitary_resolution_number: optionalStringSchema,
  sanitary_resolution_issue_date: optionalDateSchema,
  sanitary_resolution_expiry_date: optionalDateSchema,
  logo_url: z.string().url('URL de logo inválida').optional().nullable(),
})

export type FuneralHomeInput = z.infer<typeof funeralHomeSchema>

// Schema for creating a new funeral home (onboarding)
export const createFuneralHomeSchema = funeralHomeSchema.extend({
  // Initial admin user
  admin_name: requiredStringSchema.min(2, 'El nombre del administrador es requerido'),
  admin_email: z.string().email('Email del administrador inválido'),
  admin_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type CreateFuneralHomeInput = z.infer<typeof createFuneralHomeSchema>

// Schema for updating funeral home settings
export const updateFuneralHomeSchema = funeralHomeSchema.partial()

export type UpdateFuneralHomeInput = z.infer<typeof updateFuneralHomeSchema>

// Schema for updating sanitary resolution
export const updateSanitaryResolutionSchema = z.object({
  sanitary_resolution_number: requiredStringSchema,
  sanitary_resolution_issue_date: z.string(),
  sanitary_resolution_expiry_date: z.string(),
}).refine(
  (data) => {
    const issue = new Date(data.sanitary_resolution_issue_date)
    const expiry = new Date(data.sanitary_resolution_expiry_date)
    return expiry > issue
  },
  {
    message: 'La fecha de vencimiento debe ser posterior a la fecha de emisión',
    path: ['sanitary_resolution_expiry_date'],
  }
)

export type UpdateSanitaryResolutionInput = z.infer<typeof updateSanitaryResolutionSchema>

// Schema for uploading logo
export const uploadLogoSchema = z.object({
  file: z.object({
    name: requiredStringSchema,
    size: z.number().max(2 * 1024 * 1024, 'El logo no puede exceder 2MB'),
    type: z.string().refine(
      (val) => ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(val),
      'Tipo de imagen no permitido. Use JPG, PNG, WebP o SVG'
    ),
  }),
})

export type UploadLogoInput = z.infer<typeof uploadLogoSchema>
