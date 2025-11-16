'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  updateMortuaryQuotaSchema,
  UpdateMortuaryQuotaInput,
  updateMortuaryQuotaStatusSchema,
  UpdateMortuaryQuotaStatusInput,
  mortuaryQuotaWithValidationSchema,
} from '@/lib/validations/mortuary-quota'
import { success, failure, ActionResult, getErrorMessage } from '@/lib/utils/errors'
import type { MortuaryQuota } from '@/types/database'

export async function getMortuaryQuotas(filters?: {
  status?: string
  entity?: string
  date_from?: string
  date_to?: string
  search?: string
}) {
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
    .select('funeral_home_id')
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

  // Query mortuary quotas via services to respect multi-tenant access
  let query = supabase
    .from('mortuary_quotas')
    .select(
      `
      *,
      service:services!inner(
        id,
        numero_servicio,
        nombre_fallecido,
        nombre_responsable,
        funeral_home_id,
        branch_id
      )
    `
    )
    .eq('service.funeral_home_id', profile.funeral_home_id)
    .order('created_at', { ascending: false })

  if (branchIds.length > 0) {
    query = query.in('service.branch_id', branchIds)
  }

  if (filters?.status) {
    query = query.eq('estado', filters.status)
  }

  if (filters?.entity) {
    query = query.eq('entidad', filters.entity)
  }

  if (filters?.date_from) {
    query = query.gte('fecha_solicitud', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('fecha_solicitud', filters.date_to)
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
      (quota: any) =>
        quota.service?.nombre_fallecido?.toLowerCase().includes(searchLower) ||
        quota.service?.numero_servicio?.toLowerCase().includes(searchLower) ||
        quota.nombre_entidad?.toLowerCase().includes(searchLower)
    )
  }

  return filteredData
}

export async function getMortuaryQuota(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('mortuary_quotas')
    .select(
      `
      *,
      service:services(
        id,
        numero_servicio,
        nombre_fallecido,
        rut_fallecido,
        nombre_responsable,
        rut_responsable,
        telefono_responsable,
        email_responsable,
        funeral_home_id,
        branch_id
      ),
      documents(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateMortuaryQuota(
  input: UpdateMortuaryQuotaInput
): Promise<ActionResult<MortuaryQuota>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validated = updateMortuaryQuotaSchema.parse(input)
    const { quota_id, ...updateData } = validated

    // Validate conditional requirements if aplica is being set to true
    if (updateData.aplica) {
      mortuaryQuotaWithValidationSchema.parse({
        service_id: 'placeholder', // Will be ignored, just for validation
        ...updateData,
      })
    }

    const { data, error } = await supabase
      .from('mortuary_quotas')
      .update(updateData)
      .eq('id', quota_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/cuotas-mortuorias')
    revalidatePath(`/cuotas-mortuorias/${quota_id}`)
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function updateMortuaryQuotaStatus(
  input: UpdateMortuaryQuotaStatusInput
): Promise<ActionResult<MortuaryQuota>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure('UNAUTHORIZED', 'No autenticado')
    }

    const validated = updateMortuaryQuotaStatusSchema.parse(input)
    const { quota_id, estado, fecha_resolucion, fecha_pago } = validated

    const updateData: Record<string, unknown> = { estado }

    // Add relevant dates based on status
    if (estado === 'aprobada' || estado === 'rechazada') {
      updateData.fecha_resolucion = fecha_resolucion || new Date().toISOString().split('T')[0]
    }

    if (estado === 'pagada' && fecha_pago) {
      updateData.fecha_pago = fecha_pago
    }

    const { data, error } = await supabase
      .from('mortuary_quotas')
      .update(updateData)
      .eq('id', quota_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/cuotas-mortuorias')
    revalidatePath(`/cuotas-mortuorias/${quota_id}`)
    return success(data)
  } catch (error) {
    return failure('VALIDATION_ERROR', getErrorMessage(error))
  }
}

export async function getMortuaryQuotaStats() {
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

  // Get quotas through services to respect multi-tenant access
  const { data: quotas } = await supabase
    .from('mortuary_quotas')
    .select(
      `
      estado,
      monto_facturado,
      service:services!inner(funeral_home_id)
    `
    )
    .eq('service.funeral_home_id', profile.funeral_home_id)

  if (!quotas) {
    return {
      total: 0,
      en_preparacion: 0,
      ingresadas: 0,
      aprobadas: 0,
      rechazadas: 0,
      pagadas: 0,
      monto_total_aprobado: 0,
      monto_total_pagado: 0,
    }
  }

  const stats = {
    total: quotas.length,
    en_preparacion: quotas.filter((q) => q.estado === 'en_preparacion').length,
    ingresadas: quotas.filter((q) => q.estado === 'ingresada').length,
    aprobadas: quotas.filter((q) => q.estado === 'aprobada').length,
    rechazadas: quotas.filter((q) => q.estado === 'rechazada').length,
    pagadas: quotas.filter((q) => q.estado === 'pagada').length,
    monto_total_aprobado: quotas
      .filter((q) => q.estado === 'aprobada' || q.estado === 'pagada')
      .reduce((sum, q) => sum + (q.monto_facturado || 0), 0),
    monto_total_pagado: quotas
      .filter((q) => q.estado === 'pagada')
      .reduce((sum, q) => sum + (q.monto_facturado || 0), 0),
  }

  return stats
}
