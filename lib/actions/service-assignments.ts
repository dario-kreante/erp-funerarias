'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createServiceAssignmentSchema,
  updateServiceAssignmentSchema,
  type CreateServiceAssignmentInput,
  type UpdateServiceAssignmentInput,
} from '@/lib/validations/service-assignment'

export async function getServiceAssignments(serviceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('service_assignments')
    .select(
      `
      *,
      collaborator:collaborators(id, nombre_completo, rut, type, cargo)
    `
    )
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getCollaboratorAssignments(collaboratorId: string, filters?: { fecha_desde?: string; fecha_hasta?: string }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  let query = supabase
    .from('service_assignments')
    .select(
      `
      *,
      service:services(
        id,
        numero_servicio,
        nombre_fallecido,
        fecha_fallecimiento,
        estado,
        tipo_servicio
      )
    `
    )
    .eq('collaborator_id', collaboratorId)
    .order('created_at', { ascending: false })

  if (filters?.fecha_desde) {
    query = query.gte('created_at', filters.fecha_desde)
  }

  if (filters?.fecha_hasta) {
    query = query.lte('created_at', filters.fecha_hasta + 'T23:59:59')
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function createServiceAssignment(input: CreateServiceAssignmentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = createServiceAssignmentSchema.parse(input)

  // Check if collaborator is already assigned to this service
  const { data: existingAssignment } = await supabase
    .from('service_assignments')
    .select('id')
    .eq('service_id', validated.service_id)
    .eq('collaborator_id', validated.collaborator_id)
    .single()

  if (existingAssignment) {
    throw new Error('Este colaborador ya está asignado a este servicio')
  }

  const { data, error } = await supabase
    .from('service_assignments')
    .insert(validated)
    .select(
      `
      *,
      collaborator:collaborators(id, nombre_completo, rut, type, cargo)
    `
    )
    .single()

  if (error) {
    throw error
  }

  revalidatePath(`/servicios/${validated.service_id}`)
  revalidatePath('/nomina/colaboradores')
  return data
}

export async function updateServiceAssignment(input: UpdateServiceAssignmentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = updateServiceAssignmentSchema.parse(input)
  const { assignment_id, ...updateData } = validated

  const { data, error } = await supabase
    .from('service_assignments')
    .update(updateData)
    .eq('id', assignment_id)
    .select(
      `
      *,
      collaborator:collaborators(id, nombre_completo, rut, type, cargo)
    `
    )
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/servicios')
  revalidatePath('/nomina/colaboradores')
  return data
}

export async function deleteServiceAssignment(assignmentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get the service_id before deleting
  const { data: assignment } = await supabase
    .from('service_assignments')
    .select('service_id')
    .eq('id', assignmentId)
    .single()

  const { error } = await supabase.from('service_assignments').delete().eq('id', assignmentId)

  if (error) {
    throw error
  }

  if (assignment) {
    revalidatePath(`/servicios/${assignment.service_id}`)
  }
  revalidatePath('/nomina/colaboradores')
}

export async function getAssignmentStats(collaboratorId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('service_assignments')
    .select('monto_extra, rol_en_servicio, tipo_extra')
    .eq('collaborator_id', collaboratorId)

  if (error) {
    throw error
  }

  const stats = {
    total_servicios: data?.length || 0,
    total_extras: data?.reduce((sum, a) => sum + (a.monto_extra || 0), 0) || 0,
    roles: {} as Record<string, number>,
    tipos_extra: {} as Record<string, number>,
  }

  for (const assignment of data || []) {
    // Count roles
    if (assignment.rol_en_servicio) {
      stats.roles[assignment.rol_en_servicio] = (stats.roles[assignment.rol_en_servicio] || 0) + 1
    }

    // Count extra types
    if (assignment.tipo_extra && assignment.tipo_extra !== 'ninguno') {
      stats.tipos_extra[assignment.tipo_extra] = (stats.tipos_extra[assignment.tipo_extra] || 0) + 1
    }
  }

  return stats
}
