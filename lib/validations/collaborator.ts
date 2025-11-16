import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  collaboratorTypeEnum,
  rutSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  optionalStringSchema,
  requiredStringSchema,
  moneySchema,
} from './common'

export const collaboratorSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: optionalUuidSchema,
  nombre_completo: requiredStringSchema.min(3, 'El nombre debe tener al menos 3 caracteres'),
  rut: rutSchema,
  type: collaboratorTypeEnum,
  cargo: optionalStringSchema,
  telefono: optionalPhoneSchema,
  email: optionalEmailSchema,
  sueldo_base: moneySchema.optional().nullable(),
  metodo_pago: optionalStringSchema,
  estado_activo: z.boolean().default(true),
  notas: optionalStringSchema,
})

export type CollaboratorInput = z.infer<typeof collaboratorSchema>

// Schema for creating a new collaborator
export const createCollaboratorSchema = collaboratorSchema

export type CreateCollaboratorInput = z.infer<typeof createCollaboratorSchema>

// Schema for updating collaborator
export const updateCollaboratorSchema = collaboratorSchema.partial().extend({
  collaborator_id: uuidSchema,
})

export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>

// Schema for deactivating collaborator
export const deactivateCollaboratorSchema = z.object({
  collaborator_id: uuidSchema,
  motivo: optionalStringSchema,
})

export type DeactivateCollaboratorInput = z.infer<typeof deactivateCollaboratorSchema>

// Schema for collaborator filters
export const collaboratorFilterSchema = z.object({
  branch_id: uuidSchema.optional(),
  type: collaboratorTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  cargo: z.string().optional(),
  search: z.string().optional(),
})

export type CollaboratorFilter = z.infer<typeof collaboratorFilterSchema>

// Common payment methods for collaborators
export const paymentMethods = ['transferencia', 'cheque', 'efectivo'] as const

export const collaboratorPaymentMethodEnum = z.enum(paymentMethods)
