'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createCollaboratorSchema,
  updateCollaboratorSchema,
  deactivateCollaboratorSchema,
  type CreateCollaboratorInput,
  type UpdateCollaboratorInput,
  type DeactivateCollaboratorInput,
  type CollaboratorFilter,
} from '@/lib/validations/collaborator'

export async function getCollaborators(filters?: CollaboratorFilter) {
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

  let query = supabase
    .from('collaborators')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre_completo', { ascending: true })

  if (filters?.branch_id) {
    query = query.eq('branch_id', filters.branch_id)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.cargo) {
    query = query.ilike('cargo', `%${filters.cargo}%`)
  }

  if (filters?.search) {
    query = query.or(
      `nombre_completo.ilike.%${filters.search}%,rut.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getCollaborator(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('collaborators')
    .select(
      `
      *,
      branch:branches(id, nombre),
      service_assignments(
        *,
        service:services(id, numero_servicio, nombre_fallecido, fecha_fallecimiento)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createCollaborator(input: CreateCollaboratorInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const validated = createCollaboratorSchema.parse({
    ...input,
    funeral_home_id: profile.funeral_home_id,
  })

  const { data, error } = await supabase
    .from('collaborators')
    .insert(validated)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un colaborador con este RUT')
    }
    throw error
  }

  revalidatePath('/nomina/colaboradores')
  return data
}

export async function updateCollaborator(input: UpdateCollaboratorInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = updateCollaboratorSchema.parse(input)
  const { collaborator_id, ...updateData } = validated

  const { data, error } = await supabase
    .from('collaborators')
    .update(updateData)
    .eq('id', collaborator_id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un colaborador con este RUT')
    }
    throw error
  }

  revalidatePath('/nomina/colaboradores')
  revalidatePath(`/nomina/colaboradores/${collaborator_id}`)
  return data
}

export async function deactivateCollaborator(input: DeactivateCollaboratorInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = deactivateCollaboratorSchema.parse(input)

  const { data, error } = await supabase
    .from('collaborators')
    .update({
      estado_activo: false,
      notas: validated.motivo
        ? `${validated.motivo} - Desactivado el ${new Date().toLocaleDateString('es-CL')}`
        : `Desactivado el ${new Date().toLocaleDateString('es-CL')}`,
    })
    .eq('id', validated.collaborator_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/colaboradores')
  return data
}

export async function reactivateCollaborator(collaboratorId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('collaborators')
    .update({ estado_activo: true })
    .eq('id', collaboratorId)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/nomina/colaboradores')
  return data
}

export async function deleteCollaborator(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('collaborators').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/nomina/colaboradores')
}

export async function getCollaboratorPayrollHistory(collaboratorId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('collaborator_payroll_history')
    .select('*')
    .eq('collaborator_id', collaboratorId)
    .order('fecha_inicio', { ascending: false })

  if (error) {
    throw error
  }

  return data
}
