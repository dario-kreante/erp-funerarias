import { z } from 'zod'
import {
  uuidSchema,
  optionalRutSchema,
  optionalStringSchema,
  requiredStringSchema,
} from './common'

export const supplierSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre: requiredStringSchema.min(2, 'El nombre del proveedor debe tener al menos 2 caracteres'),
  rut: optionalRutSchema,
  tipo_negocio: optionalStringSchema,
  informacion_contacto: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type SupplierInput = z.infer<typeof supplierSchema>

// Schema for creating a new supplier
export const createSupplierSchema = supplierSchema

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>

// Schema for updating supplier
export const updateSupplierSchema = supplierSchema.partial().extend({
  supplier_id: uuidSchema,
})

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>

// Schema for supplier filters
export const supplierFilterSchema = z.object({
  tipo_negocio: z.string().optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export type SupplierFilter = z.infer<typeof supplierFilterSchema>

// Common business types for suppliers
export const businessTypes = [
  'ataudes_urnas',
  'floreria',
  'transporte',
  'cementerio',
  'crematorio',
  'servicios_funerarios',
  'insumos',
  'otros',
] as const

export const businessTypeEnum = z.enum(businessTypes)
