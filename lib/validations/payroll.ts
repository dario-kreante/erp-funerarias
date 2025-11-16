import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  requiredStringSchema,
  optionalStringSchema,
  moneySchema,
  dateSchema,
  payrollPeriodStatusEnum,
  paymentReceiptStatusEnum,
} from './common'

// Payroll Period schemas
export const payrollPeriodSchema = z.object({
  funeral_home_id: uuidSchema,
  nombre: requiredStringSchema.min(3, 'El nombre debe tener al menos 3 caracteres'),
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
  estado: payrollPeriodStatusEnum.default('abierto'),
  notas: optionalStringSchema,
}).refine(
  (data) => new Date(data.fecha_fin) >= new Date(data.fecha_inicio),
  {
    message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
    path: ['fecha_fin'],
  }
)

export type PayrollPeriodInput = z.infer<typeof payrollPeriodSchema>

export const createPayrollPeriodSchema = payrollPeriodSchema

export type CreatePayrollPeriodInput = z.infer<typeof createPayrollPeriodSchema>

export const updatePayrollPeriodSchema = payrollPeriodSchema.partial().extend({
  period_id: uuidSchema,
})

export type UpdatePayrollPeriodInput = z.infer<typeof updatePayrollPeriodSchema>

// Payroll Record schemas
export const payrollRecordSchema = z.object({
  payroll_period_id: uuidSchema,
  collaborator_id: uuidSchema,
  funeral_home_id: uuidSchema,
  sueldo_base: moneySchema.default(0),
  dias_trabajados: z.number().int().min(0).max(31).default(0),
  cantidad_servicios: z.number().int().min(0).default(0),
  total_extras: moneySchema.default(0),
  bonos: moneySchema.default(0),
  comisiones: moneySchema.default(0),
  descuentos: moneySchema.default(0),
  adelantos: moneySchema.default(0),
  aprobado: z.boolean().default(false),
  notas: optionalStringSchema,
})

export type PayrollRecordInput = z.infer<typeof payrollRecordSchema>

export const createPayrollRecordSchema = payrollRecordSchema

export type CreatePayrollRecordInput = z.infer<typeof createPayrollRecordSchema>

export const updatePayrollRecordSchema = payrollRecordSchema.partial().extend({
  record_id: uuidSchema,
})

export type UpdatePayrollRecordInput = z.infer<typeof updatePayrollRecordSchema>

// Batch update for payroll records
export const batchUpdatePayrollRecordsSchema = z.object({
  period_id: uuidSchema,
  updates: z.array(
    z.object({
      collaborator_id: uuidSchema,
      bonos: moneySchema.optional(),
      comisiones: moneySchema.optional(),
      descuentos: moneySchema.optional(),
      adelantos: moneySchema.optional(),
      notas: optionalStringSchema,
    })
  ),
})

export type BatchUpdatePayrollRecordsInput = z.infer<typeof batchUpdatePayrollRecordsSchema>

// Approve payroll record
export const approvePayrollRecordSchema = z.object({
  record_id: uuidSchema,
})

export type ApprovePayrollRecordInput = z.infer<typeof approvePayrollRecordSchema>

// Close payroll period
export const closePayrollPeriodSchema = z.object({
  period_id: uuidSchema,
  notas: optionalStringSchema,
})

export type ClosePayrollPeriodInput = z.infer<typeof closePayrollPeriodSchema>

// Payment Receipt schemas
export const paymentReceiptSchema = z.object({
  payroll_record_id: uuidSchema,
  funeral_home_id: uuidSchema,
  fecha_emision: dateSchema.optional(),
  colaborador_nombre: requiredStringSchema,
  colaborador_rut: requiredStringSchema,
  periodo_nombre: requiredStringSchema,
  sueldo_base: moneySchema.default(0),
  extras: moneySchema.default(0),
  bonos: moneySchema.default(0),
  comisiones: moneySchema.default(0),
  total_bruto: moneySchema.default(0),
  descuentos: moneySchema.default(0),
  adelantos: moneySchema.default(0),
  total_deducciones: moneySchema.default(0),
  total_neto: moneySchema.default(0),
  estado: paymentReceiptStatusEnum.default('pendiente'),
  metodo_pago: optionalStringSchema,
  notas: optionalStringSchema,
})

export type PaymentReceiptInput = z.infer<typeof paymentReceiptSchema>

// Generate receipt for a payroll record
export const generateReceiptSchema = z.object({
  payroll_record_id: uuidSchema,
})

export type GenerateReceiptInput = z.infer<typeof generateReceiptSchema>

// Generate receipts for entire period
export const generatePeriodReceiptsSchema = z.object({
  period_id: uuidSchema,
})

export type GeneratePeriodReceiptsInput = z.infer<typeof generatePeriodReceiptsSchema>

// Update receipt status
export const updateReceiptStatusSchema = z.object({
  receipt_id: uuidSchema,
  estado: paymentReceiptStatusEnum,
  metodo_pago: optionalStringSchema,
  fecha_pago: dateSchema.optional().nullable(),
})

export type UpdateReceiptStatusInput = z.infer<typeof updateReceiptStatusSchema>

// Filter schemas
export const payrollPeriodFilterSchema = z.object({
  estado: payrollPeriodStatusEnum.optional(),
  fecha_desde: dateSchema.optional(),
  fecha_hasta: dateSchema.optional(),
  search: z.string().optional(),
})

export type PayrollPeriodFilter = z.infer<typeof payrollPeriodFilterSchema>

export const payrollRecordFilterSchema = z.object({
  period_id: uuidSchema.optional(),
  collaborator_id: uuidSchema.optional(),
  aprobado: z.boolean().optional(),
  search: z.string().optional(),
})

export type PayrollRecordFilter = z.infer<typeof payrollRecordFilterSchema>

export const paymentReceiptFilterSchema = z.object({
  period_id: uuidSchema.optional(),
  collaborator_id: uuidSchema.optional(),
  estado: paymentReceiptStatusEnum.optional(),
  search: z.string().optional(),
})

export type PaymentReceiptFilter = z.infer<typeof paymentReceiptFilterSchema>

// Calculate payroll for period schema
export const calculatePayrollSchema = z.object({
  period_id: uuidSchema,
  include_inactive: z.boolean().default(false),
})

export type CalculatePayrollInput = z.infer<typeof calculatePayrollSchema>

// Report filters
export const collaboratorReportFilterSchema = z.object({
  collaborator_id: uuidSchema,
  fecha_desde: dateSchema.optional(),
  fecha_hasta: dateSchema.optional(),
})

export type CollaboratorReportFilter = z.infer<typeof collaboratorReportFilterSchema>
