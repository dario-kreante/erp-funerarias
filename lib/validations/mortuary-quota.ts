import { z } from 'zod'
import {
  uuidSchema,
  mortuaryQuotaStatusEnum,
  mortuaryQuotaEntityEnum,
  mortuaryQuotaPayerEnum,
  optionalDateSchema,
  moneySchema,
  optionalStringSchema,
} from './common'

export const mortuaryQuotaSchema = z.object({
  service_id: uuidSchema,
  aplica: z.boolean().default(false),
  entidad: mortuaryQuotaEntityEnum.optional().nullable(),
  nombre_entidad: optionalStringSchema,
  monto_facturado: moneySchema.optional().nullable(),
  pagador: mortuaryQuotaPayerEnum.optional().nullable(),
  estado: mortuaryQuotaStatusEnum.default('no_iniciada'),
  fecha_solicitud: optionalDateSchema,
  fecha_resolucion: optionalDateSchema,
  fecha_pago: optionalDateSchema,
})

export type MortuaryQuotaInput = z.infer<typeof mortuaryQuotaSchema>

// Schema for creating mortuary quota
export const createMortuaryQuotaSchema = mortuaryQuotaSchema

export type CreateMortuaryQuotaInput = z.infer<typeof createMortuaryQuotaSchema>

// Schema for updating mortuary quota status
export const updateMortuaryQuotaStatusSchema = z.object({
  quota_id: uuidSchema,
  estado: mortuaryQuotaStatusEnum,
  fecha_resolucion: optionalDateSchema,
  fecha_pago: optionalDateSchema,
})

export type UpdateMortuaryQuotaStatusInput = z.infer<typeof updateMortuaryQuotaStatusSchema>

// Schema for updating mortuary quota details
export const updateMortuaryQuotaSchema = mortuaryQuotaSchema.partial().extend({
  quota_id: uuidSchema,
})

export type UpdateMortuaryQuotaInput = z.infer<typeof updateMortuaryQuotaSchema>

// Validation: if aplica is true, then entidad and pagador should be required
export const mortuaryQuotaWithValidationSchema = mortuaryQuotaSchema.refine(
  (data) => {
    if (data.aplica) {
      return data.entidad != null && data.pagador != null
    }
    return true
  },
  {
    message: 'Cuando aplica cuota mortuoria, debe especificar la entidad y el pagador',
    path: ['entidad'],
  }
)
