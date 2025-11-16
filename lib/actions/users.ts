'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  inviteUserSchema,
  InviteUserInput,
  updateUserRoleSchema,
  UpdateUserRoleInput,
  updateUserProfileSchema,
  UpdateUserProfileInput,
  deactivateUserSchema,
  DeactivateUserInput,
  changePasswordSchema,
  ChangePasswordInput,
  UserFilter,
} from '@/lib/validations/user'
import { assignUserToBranchSchema, AssignUserToBranchInput } from '@/lib/validations/branch'
import { success, failure, ActionResult, getErrorMessage } from '@/lib/utils/errors'
import type { Profile } from '@/types/database'

export async function getUsers(filters?: UserFilter) {
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

  // Only admins can view user list
  if (profile.role !== 'admin') {
    throw new Error('No autorizado')
  }

  let query = supabase
    .from('profiles')
    .select(
      `
      *,
      user_branches(
        branch_id,
        branch:branches(id, nombre)
      )
    `
    )
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre_completo', { ascending: true })

  if (filters?.role) {
    query = query.eq('role', filters.role)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.branch_id) {
    query = query.contains('user_branches', [{ branch_id: filters.branch_id }])
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
      (user) =>
        user.nombre_completo.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    )
  }

  return filteredData
}

export async function getUser(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      user_branches(
        branch_id,
        branch:branches(id, nombre)
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

export async function inviteUser(input: InviteUserInput): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Get current user's funeral_home_id and check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden invitar usuarios')
    }

    const validated = inviteUserSchema.parse(input)

    // Create user in auth
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: validated.email,
      email_confirm: true,
      user_metadata: {
        nombre_completo: validated.nombre_completo,
      },
    })

    if (authError) {
      throw authError
    }

    if (!authUser.user) {
      return failure('SERVER_ERROR', 'Error al crear usuario')
    }

    // Create profile
    const { data: newProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        funeral_home_id: profile.funeral_home_id,
        nombre_completo: validated.nombre_completo,
        email: validated.email,
        role: validated.role,
        estado_activo: true,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authUser.user.id)
      throw profileError
    }

    // Assign user to branches
    const branchAssignments = validated.branch_ids.map((branch_id) => ({
      user_id: authUser.user!.id,
      branch_id,
    }))

    const { error: branchError } = await adminSupabase
      .from('user_branches')
      .insert(branchAssignments)

    if (branchError) {
      // Don't rollback user creation, but log the error
      console.error('Error assigning branches:', branchError)
    }

    revalidatePath('/administracion/usuarios')
    return success(newProfile)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function updateUserRole(
  input: UpdateUserRoleInput
): Promise<ActionResult<Profile>> {
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
      return failure('UNAUTHORIZED', 'Solo administradores pueden cambiar roles')
    }

    const validated = updateUserRoleSchema.parse(input)

    // Prevent changing own role
    if (validated.user_id === user.id) {
      return failure('VALIDATION_ERROR', 'No puedes cambiar tu propio rol')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: validated.role })
      .eq('id', validated.user_id)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/usuarios')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function deactivateUser(
  input: DeactivateUserInput
): Promise<ActionResult<Profile>> {
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
      return failure('UNAUTHORIZED', 'Solo administradores pueden desactivar usuarios')
    }

    const validated = deactivateUserSchema.parse(input)

    // Prevent deactivating self
    if (validated.user_id === user.id) {
      return failure('VALIDATION_ERROR', 'No puedes desactivarte a ti mismo')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ estado_activo: false })
      .eq('id', validated.user_id)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/usuarios')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult<Profile>> {
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
      return failure('UNAUTHORIZED', 'Solo administradores pueden reactivar usuarios')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ estado_activo: true })
      .eq('id', userId)
      .eq('funeral_home_id', profile.funeral_home_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/administracion/usuarios')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function assignUserToBranch(
  input: AssignUserToBranchInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden asignar sucursales')
    }

    const validated = assignUserToBranchSchema.parse(input)

    const { error } = await supabase.from('user_branches').insert({
      user_id: validated.user_id,
      branch_id: validated.branch_id,
    })

    if (error) {
      if (error.code === '23505') {
        return failure('VALIDATION_ERROR', 'El usuario ya está asignado a esta sucursal')
      }
      throw error
    }

    revalidatePath('/administracion/usuarios')
    return success(undefined)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function removeUserFromBranch(
  userId: string,
  branchId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return failure('UNAUTHORIZED', 'Solo administradores pueden remover sucursales')
    }

    const { error } = await supabase
      .from('user_branches')
      .delete()
      .eq('user_id', userId)
      .eq('branch_id', branchId)

    if (error) {
      throw error
    }

    revalidatePath('/administracion/usuarios')
    return success(undefined)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

// Profile management (for logged-in user)
export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      funeral_home:funeral_homes(razon_social, nombre_fantasia),
      user_branches(
        branch:branches(id, nombre)
      )
    `
    )
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return { ...data, auth_user: user }
}

export async function updateCurrentUserProfile(
  input: UpdateUserProfileInput
): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validated = updateUserProfileSchema.parse(input)

    const { data, error } = await supabase
      .from('profiles')
      .update(validated)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/mi-perfil')
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validated = changePasswordSchema.parse(input)

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validated.current_password,
    })

    if (signInError) {
      return failure('VALIDATION_ERROR', 'La contraseña actual es incorrecta')
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: validated.new_password,
    })

    if (error) {
      throw error
    }

    return success(undefined)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}
