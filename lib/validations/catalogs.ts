import { z } from 'zod'
import {
  requiredStringSchema,
  optionalStringSchema,
  rutSchema,
  optionalRutSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  moneySchema,
  positiveMoneySchema,
  optionalUuidSchema,
  collaboratorTypeEnum,
  serviceTypeEnum,
  coffinUrnTypeEnum,
  cemeteryCrematoriumTypeEnum,
  vehicleStatusEnum,
} from './common'

// Collaborator Schema
export const collaboratorSchema = z.object({
  nombre_completo: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  rut: rutSchema,
  type: collaboratorTypeEnum,
  branch_id: optionalUuidSchema,
  cargo: optionalStringSchema,
  telefono: optionalPhoneSchema,
  email: optionalEmailSchema,
  sueldo_base: moneySchema.optional().nullable(),
  metodo_pago: optionalStringSchema,
  estado_activo: z.boolean().default(true),
  notas: optionalStringSchema,
})

export type CollaboratorInput = z.infer<typeof collaboratorSchema>

// Plan Schema
export const planSchema = z.object({
  nombre: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: optionalStringSchema,
  service_type: serviceTypeEnum.optional().nullable(),
  precio_base: positiveMoneySchema,
  notas: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type PlanInput = z.infer<typeof planSchema>

// Coffin/Urn Schema
export const coffinUrnSchema = z.object({
  tipo: coffinUrnTypeEnum,
  nombre_comercial: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  sku: optionalStringSchema,
  material: optionalStringSchema,
  tamano: z.enum(['adulto', 'infantil', 'especial']).optional().nullable(),
  categoria: z.enum(['economico', 'estandar', 'premium']).optional().nullable(),
  precio_venta: positiveMoneySchema,
  costo: moneySchema.optional().nullable(),
  stock_disponible: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  supplier_id: optionalUuidSchema,
  estado_activo: z.boolean().default(true),
})

export type CoffinUrnInput = z.infer<typeof coffinUrnSchema>

// Cemetery/Crematorium Schema
export const cemeteryCrematoriumSchema = z.object({
  nombre: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  tipo: cemeteryCrematoriumTypeEnum,
  direccion: optionalStringSchema,
  informacion_contacto: optionalStringSchema,
  notas: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type CemeteryCrematoriumInput = z.infer<typeof cemeteryCrematoriumSchema>

// Vehicle Schema
export const vehicleSchema = z.object({
  branch_id: optionalUuidSchema,
  placa: requiredStringSchema.min(2, 'La placa es requerida'),
  tipo_vehiculo: requiredStringSchema.min(2, 'El tipo de vehículo es requerido'),
  capacidad: z.number().int().positive('La capacidad debe ser positiva').optional().nullable(),
  estado: vehicleStatusEnum.default('disponible'),
  notas: optionalStringSchema,
})

export type VehicleInput = z.infer<typeof vehicleSchema>

// Supplier Schema
export const supplierSchema = z.object({
  nombre: requiredStringSchema.min(2, 'El nombre debe tener al menos 2 caracteres'),
  rut: optionalRutSchema,
  tipo_negocio: optionalStringSchema,
  informacion_contacto: optionalStringSchema,
  estado_activo: z.boolean().default(true),
})

export type SupplierInput = z.infer<typeof supplierSchema>

// Filter schemas for list views
export const collaboratorFilterSchema = z.object({
  type: collaboratorTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export const planFilterSchema = z.object({
  service_type: serviceTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export const coffinUrnFilterSchema = z.object({
  tipo: coffinUrnTypeEnum.optional(),
  categoria: z.enum(['economico', 'estandar', 'premium']).optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export const cemeteryCrematoriumFilterSchema = z.object({
  tipo: cemeteryCrematoriumTypeEnum.optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})

export const vehicleFilterSchema = z.object({
  estado: vehicleStatusEnum.optional(),
  tipo_vehiculo: z.string().optional(),
  search: z.string().optional(),
})

export const supplierFilterSchema = z.object({
  tipo_negocio: z.string().optional(),
  estado_activo: z.boolean().optional(),
  search: z.string().optional(),
})
