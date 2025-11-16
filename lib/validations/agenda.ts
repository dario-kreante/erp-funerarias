import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  optionalStringSchema,
  requiredStringSchema,
  dateSchema,
  optionalDateSchema,
  eventTypeEnum,
  resourceTypeEnum,
  eventStatusEnum,
  hexColorSchema,
  optionalHexColorSchema,
} from './common'

// Room (Sala) schemas
export const roomSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  nombre: requiredStringSchema.min(2, 'El nombre de la sala debe tener al menos 2 caracteres').max(100),
  descripcion: optionalStringSchema,
  capacidad: z.number().int().positive('La capacidad debe ser mayor a 0').optional().nullable(),
  ubicacion: z.string().max(255).optional().nullable(),
  equipamiento: z.array(z.string()).optional().nullable(),
  estado_activo: z.boolean().default(true),
  color: hexColorSchema.default('#3B82F6'),
  notas: optionalStringSchema,
})

export type RoomInput = z.infer<typeof roomSchema>

export const createRoomSchema = roomSchema

export const updateRoomSchema = roomSchema.partial().extend({
  room_id: uuidSchema,
})

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>

// Agenda Event schemas
export const agendaEventSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  service_id: optionalUuidSchema,
  titulo: requiredStringSchema.min(2, 'El título debe tener al menos 2 caracteres').max(255),
  descripcion: optionalStringSchema,
  tipo_evento: eventTypeEnum,
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
  todo_el_dia: z.boolean().default(false),
  es_recurrente: z.boolean().default(false),
  patron_recurrencia: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().int().positive(),
      endDate: z.string().optional(),
    })
    .optional()
    .nullable(),
  color: optionalHexColorSchema,
  estado: eventStatusEnum.default('programado'),
  notas: optionalStringSchema,
  created_by: optionalUuidSchema,
})

export type AgendaEventInput = z.infer<typeof agendaEventSchema>

// Validate that end date is after start date
export const createAgendaEventSchema = agendaEventSchema.refine(
  (data) => {
    const start = new Date(data.fecha_inicio)
    const end = new Date(data.fecha_fin)
    return end > start
  },
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin'],
  }
)

export const updateAgendaEventSchema = agendaEventSchema.partial().extend({
  event_id: uuidSchema,
})

export type UpdateAgendaEventInput = z.infer<typeof updateAgendaEventSchema>

// Resource Booking schemas
export const resourceBookingSchema = z.object({
  event_id: uuidSchema,
  tipo_recurso: resourceTypeEnum,
  recurso_id: uuidSchema,
  fecha_inicio_reserva: optionalDateSchema,
  fecha_fin_reserva: optionalDateSchema,
  confirmado: z.boolean().default(true),
  notas: optionalStringSchema,
})

export type ResourceBookingInput = z.infer<typeof resourceBookingSchema>

// Validate reservation dates if both are provided
export const createResourceBookingSchema = resourceBookingSchema.refine(
  (data) => {
    if (data.fecha_inicio_reserva && data.fecha_fin_reserva) {
      const start = new Date(data.fecha_inicio_reserva)
      const end = new Date(data.fecha_fin_reserva)
      return end > start
    }
    return true
  },
  {
    message: 'La fecha de fin de reserva debe ser posterior a la fecha de inicio',
    path: ['fecha_fin_reserva'],
  }
)

// Filter schemas for queries
export const agendaEventFilterSchema = z.object({
  branch_id: optionalUuidSchema,
  tipo_evento: eventTypeEnum.optional(),
  estado: eventStatusEnum.optional(),
  fecha_desde: optionalDateSchema,
  fecha_hasta: optionalDateSchema,
  service_id: optionalUuidSchema,
  search: z.string().optional(),
})

export type AgendaEventFilter = z.infer<typeof agendaEventFilterSchema>

export const roomFilterSchema = z.object({
  branch_id: optionalUuidSchema,
  estado_activo: z.boolean().optional(),
  capacidad_minima: z.number().int().positive().optional(),
})

export type RoomFilter = z.infer<typeof roomFilterSchema>

// Conflict check schema
export const conflictCheckSchema = z.object({
  tipo_recurso: resourceTypeEnum,
  recurso_id: uuidSchema,
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
  exclude_event_id: optionalUuidSchema,
})

export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>

// Available resources query schema
export const availableResourcesSchema = z.object({
  funeral_home_id: uuidSchema,
  branch_id: uuidSchema,
  tipo_recurso: resourceTypeEnum,
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
})

export type AvailableResourcesInput = z.infer<typeof availableResourcesSchema>

// Event with resources (for creating events with resource bookings in one operation)
export const eventWithResourcesSchema = createAgendaEventSchema.and(
  z.object({
    recursos: z
      .array(
        z.object({
          tipo_recurso: resourceTypeEnum,
          recurso_id: uuidSchema,
        })
      )
      .optional(),
  })
)

export type EventWithResourcesInput = z.infer<typeof eventWithResourcesSchema>
