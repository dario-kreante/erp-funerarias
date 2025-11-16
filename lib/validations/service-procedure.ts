import { z } from 'zod'
import {
  uuidSchema,
  procedureStatusEnum,
  optionalDateSchema,
  optionalStringSchema,
  requiredStringSchema,
} from './common'

export const serviceProcedureSchema = z.object({
  service_id: uuidSchema,
  tipo_tramite: requiredStringSchema.min(2, 'El tipo de trámite es requerido'),
  estado: procedureStatusEnum.default('pendiente'),
  fecha_completado: optionalDateSchema,
  notas: optionalStringSchema,
})

export type ServiceProcedureInput = z.infer<typeof serviceProcedureSchema>

// Schema for creating a new procedure
export const createServiceProcedureSchema = serviceProcedureSchema

export type CreateServiceProcedureInput = z.infer<typeof createServiceProcedureSchema>

// Schema for updating procedure status
export const updateProcedureStatusSchema = z.object({
  procedure_id: uuidSchema,
  estado: procedureStatusEnum,
  fecha_completado: optionalDateSchema,
  notas: optionalStringSchema,
})

export type UpdateProcedureStatusInput = z.infer<typeof updateProcedureStatusSchema>

// Schema for deleting procedure
export const deleteProcedureSchema = z.object({
  procedure_id: uuidSchema,
})

export type DeleteProcedureInput = z.infer<typeof deleteProcedureSchema>

// Common procedure types for Chilean funeral services
export const procedureTypes = [
  'certificado_defuncion',
  'pase_sepultacion',
  'inscripcion_registro_civil',
  'tramite_sml',
  'autorizacion_cremacion',
  'traslado_internacional',
  'cuota_mortuoria',
  'seguro_vida',
  'notificacion_afp',
  'otros',
] as const

export const procedureTypeEnum = z.enum(procedureTypes)
