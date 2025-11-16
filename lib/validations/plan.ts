import { z } from 'zod'
import {
  uuidSchema,
  serviceTypeEnum,
  optionalStringSchema,
  requiredStringSchema,
  positiveMoneySchema,
} from './common'

export const planSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre: requiredStringSchema.min(3, 'El nombre del plan debe tener al menos 3 caracteres'),
  descripcion: optionalStringSchema,
  service_type: serviceTypeEnum.optional().nullable(),
  precio_base: positiveMoneySchema,
  notas: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type PlanInput = z.infer<typeof planSchema>

// Schema for creating a new plan
export const createPlanSchema = planSchema

export type CreatePlanInput = z.infer<typeof createPlanSchema>

// Schema for updating plan
export const updatePlanSchema = planSchema.partial().extend({
  plan_id: uuidSchema,
})

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>

// Schema for plan filters
export const planFilterSchema = z.object({
  service_type: serviceTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  precio_minimo: z.number().min(0).optional(),
  precio_maximo: z.number().min(0).optional(),
  search: z.string().optional(),
})

export type PlanFilter = z.infer<typeof planFilterSchema>
