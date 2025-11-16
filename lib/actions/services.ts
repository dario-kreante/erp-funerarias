'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { serviceSchema } from '@/lib/validations/service'
import type { ServiceInput } from '@/lib/validations/service'

export async function getServices(filters?: {
  status?: string
  service_type?: string
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

  // Get user's funeral_home_id and accessible branches
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
    query = query.or(`deceased_name.ilike.%${filters.search}%,responsible_name.ilike.%${filters.search}%,service_number.ilike.%${filters.search}%`)
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
    throw error
  }

  return data
}

export async function createService(input: ServiceInput) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = serviceSchema.parse(input)

  const { data, error } = await supabase
    .from('services')
    .insert({
      ...validated,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/servicios')
  return data
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = serviceSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('services')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/servicios')
  revalidatePath(`/servicios/${id}`)
  return data
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/servicios')
}

