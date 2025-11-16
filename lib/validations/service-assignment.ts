import { z } from 'zod'
import {
  uuidSchema,
  optionalStringSchema,
  requiredStringSchema,
  moneySchema,
} from './common'

export const serviceAssignmentSchema = z.object({
  service_id: uuidSchema,
  collaborator_id: uuidSchema,
  rol_en_servicio: requiredStringSchema.min(2, 'El rol es requerido'),
  tipo_extra: requiredStringSchema.default('ninguno'),
  monto_extra: moneySchema.default(0),
  comentarios: optionalStringSchema,
})

export type ServiceAssignmentInput = z.infer<typeof serviceAssignmentSchema>

// Schema for creating a new assignment
export const createServiceAssignmentSchema = serviceAssignmentSchema

export type CreateServiceAssignmentInput = z.infer<typeof createServiceAssignmentSchema>

// Schema for updating assignment
export const updateServiceAssignmentSchema = serviceAssignmentSchema.partial().extend({
  assignment_id: uuidSchema,
})

export type UpdateServiceAssignmentInput = z.infer<typeof updateServiceAssignmentSchema>

// Schema for removing assignment
export const removeServiceAssignmentSchema = z.object({
  assignment_id: uuidSchema,
})

export type RemoveServiceAssignmentInput = z.infer<typeof removeServiceAssignmentSchema>

// Common roles in funeral services
export const serviceRoles = [
  'director_funerario',
  'embalsamador',
  'conductor',
  'asistente',
  'recepcionista',
  'tanatologo',
] as const

export const serviceRoleEnum = z.enum(serviceRoles)

// Extra payment types
export const extraTypes = [
  'ninguno',
  'horas_extra',
  'servicio_especial',
  'disponibilidad',
  'traslado_largo',
  'otro',
] as const

export const extraTypeEnum = z.enum(extraTypes)
