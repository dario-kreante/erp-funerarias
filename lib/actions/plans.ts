'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { planSchema, type PlanInput } from '@/lib/validations/catalogs'

export async function getPlans(filters?: {
  service_type?: string
  estado_activo?: boolean
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
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  let query = supabase
    .from('plans')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre', { ascending: true })

  if (filters?.service_type) {
    query = query.eq('service_type', filters.service_type)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getPlan(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase.from('plans').select('*').eq('id', id).single()

  if (error) {
    throw error
  }

  return data
}

export async function createPlan(input: PlanInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = planSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data, error } = await supabase
    .from('plans')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/planes')
  return data
}

export async function updatePlan(id: string, input: Partial<PlanInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = planSchema.partial().parse(input)

  const { data, error } = await supabase.from('plans').update(validated).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/planes')
  return data
}

export async function deletePlan(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('plans').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar el plan porque está siendo usado en servicios')
    }
    throw error
  }

  revalidatePath('/administracion/planes')
}
