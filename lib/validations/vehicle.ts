import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  vehicleStatusEnum,
  optionalStringSchema,
  requiredStringSchema,
} from './common'

// Chilean license plate format: XX-XX-00 or XXXX-00
const plateRegex = /^[A-Z]{2,4}-?\d{2}$/

export const vehicleSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: optionalUuidSchema,
  placa: requiredStringSchema.regex(plateRegex, 'Formato de placa inválido. Use: AA-00 o AAAA-00'),
  tipo_vehiculo: requiredStringSchema.min(2, 'El tipo de vehículo es requerido'),
  capacidad: z.number().int().min(1).optional().nullable(),
  estado: vehicleStatusEnum.default('disponible'),
  notas: optionalStringSchema,
})

export type VehicleInput = z.infer<typeof vehicleSchema>

// Schema for creating a new vehicle
export const createVehicleSchema = vehicleSchema

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

// Schema for updating vehicle
export const updateVehicleSchema = vehicleSchema.partial().extend({
  vehicle_id: uuidSchema,
})

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>

// Schema for updating vehicle status
export const updateVehicleStatusSchema = z.object({
  vehicle_id: uuidSchema,
  estado: vehicleStatusEnum,
  notas: optionalStringSchema,
})

export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>

// Schema for vehicle filters
export const vehicleFilterSchema = z.object({
  branch_id: uuidSchema.optional(),
  tipo_vehiculo: z.string().optional(),
  estado: vehicleStatusEnum.optional(),
  capacidad_minima: z.number().int().min(1).optional(),
  search: z.string().optional(),
})

export type VehicleFilter = z.infer<typeof vehicleFilterSchema>

// Common vehicle types
export const vehicleTypes = [
  'carroza',
  'van_traslado',
  'vehiculo_apoyo',
  'furgon',
] as const

export const vehicleTypeEnum = z.enum(vehicleTypes)
