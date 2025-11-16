import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  expenseStatusEnum,
  dateSchema,
  optionalDateSchema,
  positiveMoneySchema,
  optionalStringSchema,
  requiredStringSchema,
} from './common'

export const expenseSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  service_id: optionalUuidSchema,
  fecha_egreso: dateSchema,
  supplier_id: optionalUuidSchema,
  nombre_proveedor: optionalStringSchema,
  concepto: requiredStringSchema.min(3, 'El concepto debe tener al menos 3 caracteres'),
  monto: positiveMoneySchema,
  categoria: optionalStringSchema,
  info_impuestos: optionalStringSchema,
  numero_factura: optionalStringSchema,
  estado: expenseStatusEnum,
})

export type ExpenseInput = z.infer<typeof expenseSchema>

// Schema for creating a new expense
export const createExpenseSchema = expenseSchema.extend({
  estado: expenseStatusEnum.default('pendiente_factura'),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

// Schema for updating expense
export const updateExpenseSchema = z.object({
  expense_id: uuidSchema,
  numero_factura: optionalStringSchema,
  estado: expenseStatusEnum,
  info_impuestos: optionalStringSchema,
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

// Schema for expense filters
export const expenseFilterSchema = z.object({
  branch_id: uuidSchema.optional(),
  service_id: uuidSchema.optional(),
  supplier_id: uuidSchema.optional(),
  estado: expenseStatusEnum.optional(),
  categoria: z.string().optional(),
  fecha_desde: optionalDateSchema,
  fecha_hasta: optionalDateSchema,
  monto_minimo: z.number().min(0).optional(),
  monto_maximo: z.number().min(0).optional(),
})

export type ExpenseFilter = z.infer<typeof expenseFilterSchema>

// Common expense categories
export const expenseCategories = [
  'insumos',
  'servicios_externos',
  'combustible',
  'mantenimiento',
  'servicios_publicos',
  'arriendos',
  'honorarios',
  'impuestos',
  'seguros',
  'otros',
] as const

export const expenseCategoryEnum = z.enum(expenseCategories)
