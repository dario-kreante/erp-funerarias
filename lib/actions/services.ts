'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { serviceCreateSchema, serviceUpdateSchema } from '@/lib/validations/service'
import type { ServiceCreateInput, ServiceUpdateInput } from '@/lib/validations/service'
import { success, failure, logError, getErrorMessage } from '@/lib/utils/errors'
import type { ActionResult } from '@/lib/utils/errors'
import type { Service } from '@/types/database'

export async function getServices(filters?: {
  estado?: string
  tipo_servicio?: string
  date_from?: string
  date_to?: string
  cemetery_id?: string
  search?: string
}) {
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

  let query = supabase
    .from('services')
    .select(
      `
      *,
      plan:plans(*),
      coffin:coffin_urns!coffin_id(*),
      urn:coffin_urns!urn_id(*),
      cemetery:cemetery_crematoriums(*),
      transactions(*)
    `
    )
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('created_at', { ascending: false })

  if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.tipo_servicio) {
    query = query.eq('tipo_servicio', filters.tipo_servicio)
  }

  if (filters?.date_from) {
    query = query.gte('fecha_inhumacion_cremacion', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('fecha_inhumacion_cremacion', filters.date_to)
  }

  if (filters?.cemetery_id) {
    query = query.eq('cemetery_crematorium_id', filters.cemetery_id)
  }

  if (filters?.search) {
    query = query.or(
      `nombre_fallecido.ilike.%${filters.search}%,nombre_responsable.ilike.%${filters.search}%,numero_servicio.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getService(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      *,
      plan:plans(*),
      coffin:coffin_urns!coffin_id(*),
      urn:coffin_urns!urn_id(*),
      cemetery:cemetery_crematoriums(*),
      main_vehicle:vehicles!vehiculo_principal_id(*),
      service_items(*),
      transactions(*),
      service_assignments(
        *,
        collaborator:collaborators(*)
      ),
      mortuary_quota:mortuary_quotas(*),
      documents(*),
      service_procedures(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createService(input: ServiceCreateInput): Promise<ActionResult<Service>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validationResult = serviceCreateSchema.safeParse(input)
    if (!validationResult.success) {
      return failure('VALIDATION_ERROR', 'Datos inválidos', validationResult.error.issues)
    }

    const validated = validationResult.data

    const cleanedData = Object.fromEntries(
      Object.entries(validated).map(([key, value]) => [key, value === '' ? null : value])
    )

    const { data, error } = await supabase
      .from('services')
      .insert({
        ...cleanedData,
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
    return failure('UNKNOWN_ERROR', getErrorMessage(error))
  }
}

export async function updateService(
  id: string,
  input: ServiceUpdateInput
): Promise<ActionResult<Service>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validationResult = serviceUpdateSchema.safeParse(input)
    if (!validationResult.success) {
      return failure('VALIDATION_ERROR', 'Datos inválidos', validationResult.error.issues)
    }

    const validated = validationResult.data

    const cleanedData = Object.fromEntries(
      Object.entries(validated).map(([key, value]) => [key, value === '' ? null : value])
    )

    const { data, error } = await supabase
      .from('services')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    revalidatePath('/servicios')
    revalidatePath(`/servicios/${id}`)
    return success(data)
  } catch (error) {
    logError('updateService', error)
    return failure('UNKNOWN_ERROR', getErrorMessage(error))
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

    const { error } = await supabase.from('services').delete().eq('id', id)

    if (error) {
      logError('deleteService', error)
      return failure(error.code || 'SERVER_ERROR', getErrorMessage(error))
    }

    revalidatePath('/servicios')
    return success(undefined)
  } catch (error) {
    logError('deleteService', error)
    return failure('UNKNOWN_ERROR', getErrorMessage(error))
  }
}

export async function getCatalogData() {
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

  const [plansResult, coffinsResult, urnsResult, cemeteriesResult, vehiclesResult] =
    await Promise.all([
      supabase
        .from('plans')
        .select('id, nombre, precio_base, descripcion')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('estado_activo', true)
        .order('nombre'),
      supabase
        .from('coffin_urns')
        .select('id, nombre_comercial, precio_venta, categoria, tamano')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('tipo', 'ataud')
        .eq('estado_activo', true)
        .order('nombre_comercial'),
      supabase
        .from('coffin_urns')
        .select('id, nombre_comercial, precio_venta, categoria')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('tipo', 'urna')
        .eq('estado_activo', true)
        .order('nombre_comercial'),
      supabase
        .from('cemetery_crematoriums')
        .select('id, nombre, tipo, direccion')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('estado_activo', true)
        .order('nombre'),
      supabase
        .from('vehicles')
        .select('id, placa, tipo_vehiculo, capacidad')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('estado', 'disponible')
        .order('placa'),
    ])

  return {
    plans: plansResult.data || [],
    coffins: coffinsResult.data || [],
    urns: urnsResult.data || [],
    cemeteries: cemeteriesResult.data || [],
    vehicles: vehiclesResult.data || [],
  }
}
