import { z } from 'zod'
import {
  uuidSchema,
  transactionStatusEnum,
  paymentMethodEnum,
  dateSchema,
  optionalDateSchema,
  positiveMoneySchema,
  optionalStringSchema,
} from './common'

export const transactionSchema = z.object({
  service_id: uuidSchema,
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  fecha_transaccion: dateSchema,
  monto: positiveMoneySchema,
  moneda: z.string().default('CLP'),
  metodo_pago: paymentMethodEnum,
  cuenta_destino: optionalStringSchema,
  estado: transactionStatusEnum,
  observaciones: optionalStringSchema,
})

export type TransactionInput = z.infer<typeof transactionSchema>

// Schema for creating a new transaction
export const createTransactionSchema = transactionSchema.extend({
  estado: transactionStatusEnum.default('pendiente'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// Schema for updating transaction status
export const updateTransactionStatusSchema = z.object({
  transaction_id: uuidSchema,
  estado: transactionStatusEnum,
  observaciones: optionalStringSchema,
})

export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>

// Schema for transaction filters
export const transactionFilterSchema = z.object({
  branch_id: uuidSchema.optional(),
  service_id: uuidSchema.optional(),
  estado: transactionStatusEnum.optional(),
  metodo_pago: paymentMethodEnum.optional(),
  fecha_desde: optionalDateSchema,
  fecha_hasta: optionalDateSchema,
  monto_minimo: z.number().min(0).optional(),
  monto_maximo: z.number().min(0).optional(),
})

export type TransactionFilter = z.infer<typeof transactionFilterSchema>
