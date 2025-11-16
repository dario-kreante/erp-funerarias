import { z } from 'zod'
import {
  uuidSchema,
  cemeteryCrematoriumTypeEnum,
  optionalStringSchema,
  requiredStringSchema,
} from './common'

export const cemeteryCrematoriumSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre: requiredStringSchema.min(3, 'El nombre debe tener al menos 3 caracteres'),
  tipo: cemeteryCrematoriumTypeEnum,
  direccion: optionalStringSchema,
  informacion_contacto: optionalStringSchema,
  notas: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type CemeteryCrematoriumInput = z.infer<typeof cemeteryCrematoriumSchema>

// Schema for creating a new cemetery/crematorium
export const createCemeteryCrematoriumSchema = cemeteryCrematoriumSchema

export type CreateCemeteryCrematoriumInput = z.infer<typeof createCemeteryCrematoriumSchema>

// Schema for updating cemetery/crematorium
export const updateCemeteryCrematoriumSchema = cemeteryCrematoriumSchema.partial().extend({
  cemetery_crematorium_id: uuidSchema,
})

export type UpdateCemeteryCrematoriumInput = z.infer<typeof updateCemeteryCrematoriumSchema>

// Schema for cemetery/crematorium filters
export const cemeteryCrematoriumFilterSchema = z.object({
  tipo: cemeteryCrematoriumTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export type CemeteryCrematoriumFilter = z.infer<typeof cemeteryCrematoriumFilterSchema>
