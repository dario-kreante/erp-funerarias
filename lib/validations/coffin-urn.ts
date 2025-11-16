import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  coffinUrnTypeEnum,
  optionalStringSchema,
  requiredStringSchema,
  positiveMoneySchema,
  moneySchema,
  optionalSkuSchema,
} from './common'

export const coffinUrnSchema = z.object({
  funeral_home_id: uuidSchema,
  tipo: coffinUrnTypeEnum,
  nombre_comercial: requiredStringSchema.min(2, 'El nombre comercial debe tener al menos 2 caracteres'),
  sku: optionalSkuSchema,
  material: optionalStringSchema,
  tamano: optionalStringSchema,
  categoria: optionalStringSchema,
  precio_venta: positiveMoneySchema,
  costo: moneySchema.optional().nullable(),
  stock_disponible: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  supplier_id: optionalUuidSchema,
  estado_activo: z.boolean().default(true),
})

export type CoffinUrnInput = z.infer<typeof coffinUrnSchema>

// Schema for creating a new coffin/urn
export const createCoffinUrnSchema = coffinUrnSchema

export type CreateCoffinUrnInput = z.infer<typeof createCoffinUrnSchema>

// Schema for updating coffin/urn
export const updateCoffinUrnSchema = coffinUrnSchema.partial().extend({
  coffin_urn_id: uuidSchema,
})

export type UpdateCoffinUrnInput = z.infer<typeof updateCoffinUrnSchema>

// Schema for updating stock
export const updateStockSchema = z.object({
  coffin_urn_id: uuidSchema,
  cantidad: z.number().int(),
  motivo: optionalStringSchema,
})

export type UpdateStockInput = z.infer<typeof updateStockSchema>

// Schema for coffin/urn filters
export const coffinUrnFilterSchema = z.object({
  tipo: coffinUrnTypeEnum.optional(),
  categoria: z.string().optional(),
  material: z.string().optional(),
  supplier_id: uuidSchema.optional(),
  estado_activo: z.boolean().optional(),
  precio_minimo: z.number().min(0).optional(),
  precio_maximo: z.number().min(0).optional(),
  con_stock: z.boolean().optional(),
  search: z.string().optional(),
})

export type CoffinUrnFilter = z.infer<typeof coffinUrnFilterSchema>

// Common categories
export const coffinCategories = ['economico', 'estandar', 'premium', 'lujo'] as const
export const urnCategories = ['metalica', 'madera', 'ceramica', 'biodegradable'] as const

export const coffinCategoryEnum = z.enum(coffinCategories)
export const urnCategoryEnum = z.enum(urnCategories)
