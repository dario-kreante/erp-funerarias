'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { roomSchema, agendaEventSchema, resourceBookingSchema } from '@/lib/validations/agenda'
import type {
  RoomInput,
  AgendaEventInput,
  ResourceBookingInput,
  AgendaEventFilter,
  RoomFilter,
} from '@/lib/validations/agenda'
import type { ResourceType } from '@/types/database'

// Helper function to get user profile
async function getUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data: userBranches } = await supabase
    .from('user_branches')
    .select('branch_id')
    .eq('user_id', user.id)

  const branchIds = userBranches?.map((ub) => ub.branch_id) || []

  return { user, profile, branchIds, supabase }
}

// ========== ROOMS ==========

export async function getRooms(filters?: RoomFilter) {
  const { profile, branchIds, supabase } = await getUserProfile()

  let query = supabase
    .from('rooms')
    .select('*, branch:branches(id, nombre)')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre')

  if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (filters?.branch_id) {
    query = query.eq('branch_id', filters.branch_id)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.capacidad_minima) {
    query = query.gte('capacidad', filters.capacidad_minima)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getRoom(id: string) {
  const { supabase } = await getUserProfile()

  const { data, error } = await supabase
    .from('rooms')
    .select('*, branch:branches(id, nombre)')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createRoom(input: RoomInput) {
  const { supabase } = await getUserProfile()

  const validated = roomSchema.parse(input)

  const { data, error } = await supabase.from('rooms').insert(validated).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  revalidatePath('/administracion')
  return data
}

export async function updateRoom(id: string, input: Partial<RoomInput>) {
  const { supabase } = await getUserProfile()

  const { data, error } = await supabase.from('rooms').update(input).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  revalidatePath('/administracion')
  return data
}

export async function deleteRoom(id: string) {
  const { supabase } = await getUserProfile()

  const { error } = await supabase.from('rooms').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  revalidatePath('/administracion')
}

// ========== AGENDA EVENTS ==========

export async function getAgendaEvents(filters?: AgendaEventFilter) {
  const { profile, branchIds, supabase } = await getUserProfile()

  let query = supabase
    .from('agenda_events')
    .select(
      `
      *,
      service:services(id, numero_servicio, nombre_fallecido),
      branch:branches(id, nombre)
    `
    )
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('fecha_inicio', { ascending: true })

  if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (filters?.branch_id) {
    query = query.eq('branch_id', filters.branch_id)
  }

  if (filters?.tipo_evento) {
    query = query.eq('tipo_evento', filters.tipo_evento)
  }

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id)
  }

  if (filters?.fecha_desde) {
    query = query.gte('fecha_inicio', filters.fecha_desde)
  }

  if (filters?.fecha_hasta) {
    query = query.lte('fecha_fin', filters.fecha_hasta)
  }

  if (filters?.search) {
    query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getAgendaEvent(id: string) {
  const { supabase } = await getUserProfile()

  const { data, error } = await supabase
    .from('agenda_events')
    .select(
      `
      *,
      service:services(id, numero_servicio, nombre_fallecido, nombre_responsable),
      branch:branches(id, nombre)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  // Get resource bookings for this event
  const { data: bookings } = await supabase
    .from('agenda_resource_bookings')
    .select('*')
    .eq('event_id', id)

  return { ...data, resource_bookings: bookings || [] }
}

export async function createAgendaEvent(
  input: AgendaEventInput,
  resources?: { tipo_recurso: ResourceType; recurso_id: string }[]
) {
  const { user, supabase } = await getUserProfile()

  const validated = agendaEventSchema.parse({
    ...input,
    created_by: user.id,
  })

  // Validate end date is after start date
  const start = new Date(validated.fecha_inicio)
  const end = new Date(validated.fecha_fin)
  if (end <= start) {
    throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
  }

  // Check for resource conflicts if resources are provided
  if (resources && resources.length > 0) {
    for (const resource of resources) {
      const conflicts = await checkResourceConflict(
        resource.tipo_recurso,
        resource.recurso_id,
        validated.fecha_inicio,
        validated.fecha_fin
      )
      if (conflicts.length > 0) {
        throw new Error(
          `Conflicto de recurso detectado: ${resource.tipo_recurso} ya está reservado para "${conflicts[0].titulo}"`
        )
      }
    }
  }

  const { data, error } = await supabase.from('agenda_events').insert(validated).select().single()

  if (error) {
    throw error
  }

  // Create resource bookings if provided
  if (resources && resources.length > 0 && data) {
    const bookings = resources.map((r) => ({
      event_id: data.id,
      tipo_recurso: r.tipo_recurso,
      recurso_id: r.recurso_id,
    }))

    const { error: bookingError } = await supabase.from('agenda_resource_bookings').insert(bookings)

    if (bookingError) {
      // Rollback: delete the event if bookings fail
      await supabase.from('agenda_events').delete().eq('id', data.id)
      throw bookingError
    }
  }

  revalidatePath('/agenda')
  return data
}

export async function updateAgendaEvent(id: string, input: Partial<AgendaEventInput>) {
  const { supabase } = await getUserProfile()

  // Validate dates if both are provided
  if (input.fecha_inicio && input.fecha_fin) {
    const start = new Date(input.fecha_inicio)
    const end = new Date(input.fecha_fin)
    if (end <= start) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
    }
  }

  const { data, error } = await supabase.from('agenda_events').update(input).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  return data
}

export async function deleteAgendaEvent(id: string) {
  const { supabase } = await getUserProfile()

  const { error } = await supabase.from('agenda_events').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
}

export async function updateEventStatus(id: string, estado: string) {
  const { supabase } = await getUserProfile()

  const { data, error } = await supabase.from('agenda_events').update({ estado }).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  return data
}

// ========== RESOURCE BOOKINGS ==========

export async function getEventBookings(eventId: string) {
  const { supabase } = await getUserProfile()

  const { data, error } = await supabase.from('agenda_resource_bookings').select('*').eq('event_id', eventId)

  if (error) {
    throw error
  }

  return data
}

export async function addResourceBooking(input: ResourceBookingInput) {
  const { supabase } = await getUserProfile()

  const validated = resourceBookingSchema.parse(input)

  // Get event details to check for conflicts
  const { data: event } = await supabase
    .from('agenda_events')
    .select('fecha_inicio, fecha_fin')
    .eq('id', validated.event_id)
    .single()

  if (!event) {
    throw new Error('Evento no encontrado')
  }

  const startTime = validated.fecha_inicio_reserva || event.fecha_inicio
  const endTime = validated.fecha_fin_reserva || event.fecha_fin

  // Check for conflicts
  const conflicts = await checkResourceConflict(
    validated.tipo_recurso,
    validated.recurso_id,
    startTime,
    endTime,
    validated.event_id
  )

  if (conflicts.length > 0) {
    throw new Error(`Conflicto: el recurso ya está reservado para "${conflicts[0].titulo}"`)
  }

  const { data, error } = await supabase.from('agenda_resource_bookings').insert(validated).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
  return data
}

export async function removeResourceBooking(id: string) {
  const { supabase } = await getUserProfile()

  const { error } = await supabase.from('agenda_resource_bookings').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/agenda')
}

// ========== CONFLICT CHECKING ==========

export async function checkResourceConflict(
  tipoRecurso: ResourceType,
  recursoId: string,
  fechaInicio: string,
  fechaFin: string,
  excludeEventId?: string
): Promise<{ event_id: string; titulo: string; fecha_inicio: string; fecha_fin: string }[]> {
  const { supabase } = await getUserProfile()

  // Use the database function for conflict checking
  const { data, error } = await supabase.rpc('check_resource_conflict', {
    p_tipo_recurso: tipoRecurso,
    p_recurso_id: recursoId,
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin,
    p_exclude_event_id: excludeEventId || null,
  })

  if (error) {
    console.error('Error checking conflicts:', error)
    // If the function doesn't exist yet (migration not run), do a manual check
    return await manualConflictCheck(tipoRecurso, recursoId, fechaInicio, fechaFin, excludeEventId)
  }

  return data || []
}

// Fallback manual conflict check
async function manualConflictCheck(
  tipoRecurso: ResourceType,
  recursoId: string,
  fechaInicio: string,
  fechaFin: string,
  excludeEventId?: string
) {
  const { supabase } = await getUserProfile()

  let query = supabase
    .from('agenda_resource_bookings')
    .select(
      `
      event_id,
      fecha_inicio_reserva,
      fecha_fin_reserva,
      event:agenda_events!inner(
        id,
        titulo,
        fecha_inicio,
        fecha_fin,
        estado
      )
    `
    )
    .eq('tipo_recurso', tipoRecurso)
    .eq('recurso_id', recursoId)
    .eq('confirmado', true)
    .neq('event.estado', 'cancelado')

  if (excludeEventId) {
    query = query.neq('event_id', excludeEventId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const conflicts: { event_id: string; titulo: string; fecha_inicio: string; fecha_fin: string }[] = []
  const start = new Date(fechaInicio)
  const end = new Date(fechaFin)

  for (const booking of data || []) {
    const eventArray = booking.event as unknown as { id: string; titulo: string; fecha_inicio: string; fecha_fin: string }[]
    const event = eventArray[0]
    if (!event) continue

    const bookingStart = new Date(booking.fecha_inicio_reserva || event.fecha_inicio)
    const bookingEnd = new Date(booking.fecha_fin_reserva || event.fecha_fin)

    // Check for overlap
    if (start < bookingEnd && end > bookingStart) {
      conflicts.push({
        event_id: event.id,
        titulo: event.titulo,
        fecha_inicio: booking.fecha_inicio_reserva || event.fecha_inicio,
        fecha_fin: booking.fecha_fin_reserva || event.fecha_fin,
      })
    }
  }

  return conflicts
}

// ========== AVAILABLE RESOURCES ==========

export async function getAvailableRooms(branchId: string, fechaInicio: string, fechaFin: string) {
  const { profile, supabase } = await getUserProfile()

  // Get all active rooms for the branch
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .eq('branch_id', branchId)
    .eq('estado_activo', true)
    .order('nombre')

  if (!rooms) return []

  // Filter out rooms with conflicts
  const availableRooms = []
  for (const room of rooms) {
    const conflicts = await checkResourceConflict('sala', room.id, fechaInicio, fechaFin)
    if (conflicts.length === 0) {
      availableRooms.push(room)
    }
  }

  return availableRooms
}

export async function getAvailableVehicles(branchId: string, fechaInicio: string, fechaFin: string) {
  const { profile, supabase } = await getUserProfile()

  // Get all available vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .eq('estado', 'disponible')
    .or(`branch_id.eq.${branchId},branch_id.is.null`)
    .order('placa')

  if (!vehicles) return []

  // Filter out vehicles with conflicts
  const availableVehicles = []
  for (const vehicle of vehicles) {
    const conflicts = await checkResourceConflict('vehiculo', vehicle.id, fechaInicio, fechaFin)
    if (conflicts.length === 0) {
      availableVehicles.push(vehicle)
    }
  }

  return availableVehicles
}

export async function getAvailableCollaborators(branchId: string, fechaInicio: string, fechaFin: string) {
  const { profile, supabase } = await getUserProfile()

  // Get all active collaborators
  const { data: collaborators } = await supabase
    .from('collaborators')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .eq('estado_activo', true)
    .or(`branch_id.eq.${branchId},branch_id.is.null`)
    .order('nombre_completo')

  if (!collaborators) return []

  // Filter out collaborators with conflicts
  const availableCollaborators = []
  for (const collaborator of collaborators) {
    const conflicts = await checkResourceConflict('colaborador', collaborator.id, fechaInicio, fechaFin)
    if (conflicts.length === 0) {
      availableCollaborators.push(collaborator)
    }
  }

  return availableCollaborators
}

// ========== CALENDAR DATA ==========

export async function getCalendarEvents(startDate: string, endDate: string, branchId?: string) {
  const { profile, branchIds, supabase } = await getUserProfile()

  let query = supabase
    .from('agenda_events')
    .select(
      `
      id,
      titulo,
      descripcion,
      tipo_evento,
      fecha_inicio,
      fecha_fin,
      todo_el_dia,
      color,
      estado,
      service_id,
      service:services(numero_servicio, nombre_fallecido)
    `
    )
    .eq('funeral_home_id', profile.funeral_home_id)
    .gte('fecha_inicio', startDate)
    .lte('fecha_fin', endDate)
    .neq('estado', 'cancelado')
    .order('fecha_inicio')

  if (branchId) {
    query = query.eq('branch_id', branchId)
  } else if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

// ========== DASHBOARD STATS ==========

export async function getAgendaStats(branchId?: string) {
  const { profile, branchIds, supabase } = await getUserProfile()

  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  // Get today's events count
  let todayQuery = supabase
    .from('agenda_events')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', profile.funeral_home_id)
    .lte('fecha_inicio', endOfDay)
    .gte('fecha_fin', startOfDay)
    .neq('estado', 'cancelado')

  if (branchId) {
    todayQuery = todayQuery.eq('branch_id', branchId)
  } else if (branchIds.length > 0) {
    todayQuery = todayQuery.in('branch_id', branchIds)
  }

  const { count: todayCount } = await todayQuery

  // Get this week's events count
  let weekQuery = supabase
    .from('agenda_events')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', profile.funeral_home_id)
    .gte('fecha_inicio', startOfWeek.toISOString())
    .lte('fecha_inicio', endOfWeek.toISOString())
    .neq('estado', 'cancelado')

  if (branchId) {
    weekQuery = weekQuery.eq('branch_id', branchId)
  } else if (branchIds.length > 0) {
    weekQuery = weekQuery.in('branch_id', branchIds)
  }

  const { count: weekCount } = await weekQuery

  // Get pending events
  let pendingQuery = supabase
    .from('agenda_events')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', profile.funeral_home_id)
    .eq('estado', 'programado')
    .gte('fecha_inicio', new Date().toISOString())

  if (branchId) {
    pendingQuery = pendingQuery.eq('branch_id', branchId)
  } else if (branchIds.length > 0) {
    pendingQuery = pendingQuery.in('branch_id', branchIds)
  }

  const { count: pendingCount } = await pendingQuery

  return {
    eventosHoy: todayCount || 0,
    eventosSemana: weekCount || 0,
    eventosPendientes: pendingCount || 0,
  }
}
