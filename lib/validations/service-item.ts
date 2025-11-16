import { z } from 'zod'
import {
  uuidSchema,
  serviceItemTypeEnum,
  optionalStringSchema,
  requiredStringSchema,
  positiveMoneySchema,
  percentageSchema,
} from './common'

export const serviceItemSchema = z.object({
  service_id: uuidSchema,
  tipo_item: serviceItemTypeEnum,
  categoria: optionalStringSchema,
  descripcion: requiredStringSchema.min(2, 'La descripción es requerida'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
  precio_unitario: positiveMoneySchema,
  tasa_impuesto: percentageSchema.default(19), // IVA Chile
})

export type ServiceItemInput = z.infer<typeof serviceItemSchema>

// Schema for creating a new service item
export const createServiceItemSchema = serviceItemSchema

export type CreateServiceItemInput = z.infer<typeof createServiceItemSchema>

// Schema for updating service item
export const updateServiceItemSchema = serviceItemSchema.partial().extend({
  service_item_id: uuidSchema,
})

export type UpdateServiceItemInput = z.infer<typeof updateServiceItemSchema>

// Schema for deleting service item
export const deleteServiceItemSchema = z.object({
  service_item_id: uuidSchema,
})

export type DeleteServiceItemInput = z.infer<typeof deleteServiceItemSchema>

// Calculated total helper (for frontend use)
export const calculateItemTotal = (cantidad: number, precio_unitario: number, tasa_impuesto: number) => {
  const subtotal = cantidad * precio_unitario
  const impuesto = subtotal * (tasa_impuesto / 100)
  return subtotal + impuesto
}
