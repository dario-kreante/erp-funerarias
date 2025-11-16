'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createBranchSchema,
  CreateBranchInput,
  updateBranchSchema,
  UpdateBranchInput,
  deactivateBranchSchema,
  DeactivateBranchInput,
  BranchFilter,
} from '@/lib/validations/branch'
import { success, failure, ActionResult, getErrorMessage } from '@/lib/utils/errors'
import type { Branch } from '@/types/database'

export async function getBranches(filters?: BranchFilter) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get user's funeral_home_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  let query = supabase
    .from('branches')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre', { ascending: true })

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  // Filter by search term if provided
  let filteredData = data
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredData = data?.filter(
      (branch) =>
        branch.nombre.toLowerCase().includes(searchLower) ||
        branch.direccion?.toLowerCase().includes(searchLower) ||
        branch.nombre_gerente?.toLowerCase().includes(searchLower)
    )
  }

  return filteredData
}

export async function getBranch(id: string) {
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

  const { data, error } = await supabase
    .from('branches')
    .select(
      `
      *,
      user_branches(
        user:profiles(id, nombre_completo, email, role)
      )
    `
    )
    .eq('id', id)
    .eq('funeral_home_id', profile.funeral_home_id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createBranch(input: CreateBranchInput): Promise<ActionResult<Branch>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden crear sucursales')
    }

    const validated = createBranchSchema.parse(input)

    // Override funeral_home_id with user's funeral_home_id for security
    const { data, error } = await supabase
      .from('branches')
      .insert({
        ...validated,
        funeral_home_id: profile.funeral_home_id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/sucursales')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function updateBranch(input: UpdateBranchInput): Promise<ActionResult<Branch>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden editar sucursales')
    }

    const validated = updateBranchSchema.parse(input)
    const { branch_id, ...updateData } = validated

    // Remove funeral_home_id from update data if present (security)
    delete updateData.funeral_home_id

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', branch_id)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/sucursales')
    revalidatePath(`/administracion/sucursales/${branch_id}`)
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function deactivateBranch(
  input: DeactivateBranchInput
): Promise<ActionResult<Branch>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden desactivar sucursales')
    }

    const validated = deactivateBranchSchema.parse(input)

    // Check if there are users assigned to this branch
    const { data: assignedUsers } = await supabase
      .from('user_branches')
      .select('user_id')
      .eq('branch_id', validated.branch_id)

    if (assignedUsers && assignedUsers.length > 0) {
      return failure(
        'VALIDATION_ERROR',
        `No se puede desactivar la sucursal porque tiene ${assignedUsers.length} usuario(s) asignado(s)`
      )
    }

    const { data, error } = await supabase
      .from('branches')
      .update({ estado_activo: false })
      .eq('id', validated.branch_id)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/sucursales')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function reactivateBranch(branchId: string): Promise<ActionResult<Branch>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden reactivar sucursales')
    }

    const { data, error } = await supabase
      .from('branches')
      .update({ estado_activo: true })
      .eq('id', branchId)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/sucursales')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function getBranchStats(branchId: string) {
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

  // Get counts
  const [usersResult, servicesResult] = await Promise.all([
    supabase.from('user_branches').select('user_id', { count: 'exact' }).eq('branch_id', branchId),
    supabase
      .from('services')
      .select('id', { count: 'exact' })
      .eq('branch_id', branchId)
      .eq('funeral_home_id', profile.funeral_home_id),
  ])

  return {
    total_users: usersResult.count || 0,
    total_services: servicesResult.count || 0,
  }
}

export async function getUserBranches() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_branches')
    .select(`
      branch_id,
      branches (
        id,
        nombre,
        direccion,
        telefono,
        email,
        activa
      )
    `)
    .eq('user_id', user.id)

  if (error || !data) {
    return []
  }

  return data.map((ub: any) => ub.branches).filter(Boolean)
}

export async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return null
  }

  return data
}
