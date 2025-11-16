import { z } from 'zod'
import { isValidRut } from '@/lib/utils/rut'

// Custom RUT validation
const rutValidation = z.string().refine((val) => !val || isValidRut(val), {
  message: 'RUT inválido',
})

export const serviceSchema = z.object({
  funeral_home_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  estado: z.enum(['borrador', 'confirmado', 'en_ejecucion', 'finalizado', 'cerrado']).default('borrador'),
  tipo_servicio: z.enum(['inhumacion', 'cremacion', 'traslado_nacional', 'traslado_internacional', 'solo_velatorio']),
  notas_generales: z.string().optional().nullable(),

  // Deceased information
  nombre_fallecido: z.string().min(1, 'El nombre del fallecido es requerido'),
  rut_fallecido: rutValidation.optional().nullable(),
  fecha_nacimiento_fallecido: z.string().optional().nullable(),
  fecha_fallecimiento: z.string().min(1, 'La fecha de fallecimiento es requerida'),
  tipo_lugar_fallecimiento: z.enum(['domicilio', 'hospital', 'via_publica', 'otro']).optional().nullable(),
  lugar_fallecimiento: z.string().optional().nullable(),
  causa_fallecimiento: z.string().optional().nullable(),

  // Responsible person
  nombre_responsable: z.string().min(1, 'El nombre del responsable es requerido'),
  rut_responsable: z.string().min(1, 'El RUT del responsable es requerido').refine((val) => isValidRut(val), {
    message: 'RUT del responsable inválido',
  }),
  telefono_responsable: z.string().min(1, 'El teléfono del responsable es requerido'),
  email_responsable: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  direccion_responsable: z.string().optional().nullable(),
  parentesco_responsable: z.string().optional().nullable(),

  // Plan and products
  plan_id: z.string().uuid().optional().nullable(),
  coffin_id: z.string().uuid().optional().nullable(),
  urn_id: z.string().uuid().optional().nullable(),

  // Pricing
  monto_descuento: z.number().min(0).default(0),
  porcentaje_descuento: z.number().min(0).max(100).default(0),

  // Agenda and logistics
  fecha_recogida: z.string().optional().nullable(),
  fecha_inicio_velatorio: z.string().optional().nullable(),
  sala_velatorio: z.string().optional().nullable(),
  fecha_ceremonia_religiosa: z.string().optional().nullable(),
  fecha_inhumacion_cremacion: z.string().optional().nullable(),
  cemetery_crematorium_id: z.string().uuid().optional().nullable(),
  vehiculo_principal_id: z.string().uuid().optional().nullable(),
  otros_vehiculos: z.array(z.string()).optional().nullable(),
  notas_logistica: z.string().optional().nullable(),
})

export type ServiceInput = z.infer<typeof serviceSchema>

// Partial schema for updates
export const serviceUpdateSchema = serviceSchema.partial().omit({
  funeral_home_id: true,
  branch_id: true,
})

export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>

// Schema for creating a new service (minimal required fields)
export const serviceCreateSchema = z.object({
  funeral_home_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  tipo_servicio: z.enum(['inhumacion', 'cremacion', 'traslado_nacional', 'traslado_internacional', 'solo_velatorio']),

  // Deceased information - required
  nombre_fallecido: z.string().min(1, 'El nombre del fallecido es requerido'),
  fecha_fallecimiento: z.string().min(1, 'La fecha de fallecimiento es requerida'),

  // Responsible person - required
  nombre_responsable: z.string().min(1, 'El nombre del responsable es requerido'),
  rut_responsable: z.string().min(1, 'El RUT del responsable es requerido').refine((val) => isValidRut(val), {
    message: 'RUT del responsable inválido',
  }),
  telefono_responsable: z.string().min(1, 'El teléfono del responsable es requerido'),

  // Optional fields
  estado: z.enum(['borrador', 'confirmado', 'en_ejecucion', 'finalizado', 'cerrado']).default('borrador'),
  notas_generales: z.string().optional().nullable(),
  rut_fallecido: rutValidation.optional().nullable(),
  fecha_nacimiento_fallecido: z.string().optional().nullable(),
  tipo_lugar_fallecimiento: z.enum(['domicilio', 'hospital', 'via_publica', 'otro']).optional().nullable(),
  lugar_fallecimiento: z.string().optional().nullable(),
  causa_fallecimiento: z.string().optional().nullable(),
  email_responsable: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  direccion_responsable: z.string().optional().nullable(),
  parentesco_responsable: z.string().optional().nullable(),
  plan_id: z.string().uuid().optional().nullable(),
  coffin_id: z.string().uuid().optional().nullable(),
  urn_id: z.string().uuid().optional().nullable(),
  monto_descuento: z.number().min(0).default(0),
  porcentaje_descuento: z.number().min(0).max(100).default(0),
  fecha_recogida: z.string().optional().nullable(),
  fecha_inicio_velatorio: z.string().optional().nullable(),
  sala_velatorio: z.string().optional().nullable(),
  fecha_ceremonia_religiosa: z.string().optional().nullable(),
  fecha_inhumacion_cremacion: z.string().optional().nullable(),
  cemetery_crematorium_id: z.string().uuid().optional().nullable(),
  vehiculo_principal_id: z.string().uuid().optional().nullable(),
  otros_vehiculos: z.array(z.string()).optional().nullable(),
  notas_logistica: z.string().optional().nullable(),
})

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
