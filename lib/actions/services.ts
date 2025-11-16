'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { serviceSchema } from '@/lib/validations/service'
import type { ServiceInput } from '@/lib/validations/service'
import { ActionResult, success, failure, getErrorMessage, logError, extractZodErrors } from '@/lib/utils/errors'
import { ZodError } from 'zod'

export async function getServices(filters?: {
  status?: string
  service_type?: string
  date_from?: string
  date_to?: string
  cemetery_id?: string
  search?: string
}): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    // Get user's funeral_home_id and accessible branches
    const { data: profile } = await supabase
      .from('profiles')
      .select('funeral_home_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return failure('NOT_FOUND', 'Perfil no encontrado')
    }

    const { data: userBranches } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', user.id)

    const branchIds = userBranches?.map(ub => ub.branch_id) || []

    let query = supabase
      .from('services')
      .select(`
        *,
        plan:plans(*),
        coffin:coffin_urns!coffin_id(*),
        urn:coffin_urns!urn_id(*),
        cemetery:cemetery_crematoriums(*),
        transactions(*)
      `)
      .eq('funeral_home_id', profile.funeral_home_id)
      .order('created_at', { ascending: false })

    if (branchIds.length > 0) {
      query = query.in('branch_id', branchIds)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type)
    }

    if (filters?.date_from) {
      query = query.gte('burial_cremation_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('burial_cremation_date', filters.date_to)
    }

    if (filters?.cemetery_id) {
      query = query.eq('cemetery_crematorium_id', filters.cemetery_id)
    }

    if (filters?.search) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = filters.search.replace(/[%_\\]/g, '\\$&')
      query = query.or(`deceased_name.ilike.%${sanitizedSearch}%,responsible_name.ilike.%${sanitizedSearch}%,service_number.ilike.%${sanitizedSearch}%`)
    }

    const { data, error } = await query

    if (error) {
      logError('getServices', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    return success(data || [])
  } catch (error) {
    logError('getServices', error)
    return failure('SERVER_ERROR', getErrorMessage(error))
  }
}

export async function getService(id: string): Promise<ActionResult<unknown>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        plan:plans(*),
        coffin:coffin_urns!coffin_id(*),
        urn:coffin_urns!urn_id(*),
        cemetery:cemetery_crematoriums(*),
        main_vehicle:vehicles!main_vehicle_id(*),
        service_items(*),
        transactions(*),
        service_assignments(
          *,
          collaborator:collaborators(*)
        ),
        mortuary_quota:mortuary_quotas(*),
        documents(*),
        service_procedures(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return failure('NOT_FOUND', 'Servicio no encontrado')
      }
      logError('getService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    return success(data)
  } catch (error) {
    logError('getService', error)
    return failure('SERVER_ERROR', getErrorMessage(error))
  }
}

export async function createService(input: ServiceInput): Promise<ActionResult<unknown>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    let validated
    try {
      validated = serviceSchema.parse(input)
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = extractZodErrors(error)
        return failure('VALIDATION_ERROR', 'Datos inválidos', fieldErrors)
      }
      throw error
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        ...validated,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logError('createService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    revalidatePath('/servicios')
    return success(data)
  } catch (error) {
    logError('createService', error)
    return failure('SERVER_ERROR', getErrorMessage(error))
  }
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<ActionResult<unknown>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    let validated
    try {
      validated = serviceSchema.partial().parse(input)
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = extractZodErrors(error)
        return failure('VALIDATION_ERROR', 'Datos inválidos', fieldErrors)
      }
      throw error
    }

    const { data, error } = await supabase
      .from('services')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return failure('NOT_FOUND', 'Servicio no encontrado')
      }
      logError('updateService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    revalidatePath('/servicios')
    revalidatePath(`/servicios/${id}`)
    return success(data)
  } catch (error) {
    logError('updateService', error)
    return failure('SERVER_ERROR', getErrorMessage(error))
  }
}

export async function deleteService(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      logError('deleteService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    revalidatePath('/servicios')
    return success(undefined)
  } catch (error) {
    logError('deleteService', error)
    return failure('SERVER_ERROR', getErrorMessage(error))
  }
}

