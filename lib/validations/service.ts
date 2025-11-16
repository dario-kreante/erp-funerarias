import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  serviceStatusEnum,
  serviceTypeEnum,
  deathPlaceTypeEnum,
  optionalRutSchema,
  rutSchema,
  phoneSchema,
  optionalEmailSchema,
  optionalStringSchema,
  requiredStringSchema,
  dateSchema,
  optionalDateSchema,
  moneySchema,
  percentageSchema,
} from './common'

export const serviceSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  estado: serviceStatusEnum,
  tipo_servicio: serviceTypeEnum,
  notas_generales: optionalStringSchema,

  // Información del fallecido
  nombre_fallecido: requiredStringSchema.min(2, 'El nombre del fallecido debe tener al menos 2 caracteres'),
  rut_fallecido: optionalRutSchema,
  fecha_nacimiento_fallecido: optionalDateSchema,
  fecha_fallecimiento: dateSchema,
  tipo_lugar_fallecimiento: deathPlaceTypeEnum.optional().nullable(),
  lugar_fallecimiento: optionalStringSchema,
  causa_fallecimiento: optionalStringSchema,

  // Información del responsable
  nombre_responsable: requiredStringSchema.min(2, 'El nombre del responsable debe tener al menos 2 caracteres'),
  rut_responsable: rutSchema,
  telefono_responsable: phoneSchema,
  email_responsable: optionalEmailSchema,
  direccion_responsable: optionalStringSchema,
  parentesco_responsable: optionalStringSchema,

  // Plan y productos
  plan_id: optionalUuidSchema,
  coffin_id: optionalUuidSchema,
  urn_id: optionalUuidSchema,

  // Precios y descuentos
  monto_descuento: moneySchema.default(0),
  porcentaje_descuento: percentageSchema.default(0),

  // Agenda y logística
  fecha_recogida: optionalDateSchema,
  fecha_inicio_velatorio: optionalDateSchema,
  sala_velatorio: optionalStringSchema,
  fecha_ceremonia_religiosa: optionalDateSchema,
  fecha_inhumacion_cremacion: optionalDateSchema,
  cemetery_crematorium_id: optionalUuidSchema,
  vehiculo_principal_id: optionalUuidSchema,
  otros_vehiculos: z.array(z.string().uuid()).optional().nullable(),
  notas_logistica: optionalStringSchema,
})

export type ServiceInput = z.infer<typeof serviceSchema>

// Schema for creating a new service (draft)
export const createServiceSchema = serviceSchema.extend({
  estado: serviceStatusEnum.default('borrador'),
})

// Schema for updating service status
export const updateServiceStatusSchema = z.object({
  service_id: uuidSchema,
  estado: serviceStatusEnum,
})

// Schema for service search/filter
export const serviceFilterSchema = z.object({
  branch_id: optionalUuidSchema,
  estado: serviceStatusEnum.optional(),
  tipo_servicio: serviceTypeEnum.optional(),
  fecha_desde: optionalDateSchema,
  fecha_hasta: optionalDateSchema,
  search: z.string().optional(),
  cemetery_crematorium_id: optionalUuidSchema,
})

export type ServiceFilter = z.infer<typeof serviceFilterSchema>
