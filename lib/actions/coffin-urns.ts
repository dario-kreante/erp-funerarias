'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { coffinUrnSchema, type CoffinUrnInput } from '@/lib/validations/catalogs'

export async function getCoffinUrns(filters?: {
  tipo?: 'ataud' | 'urna'
  categoria?: 'economico' | 'estandar' | 'premium'
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
    .from('coffin_urns')
    .select('*, supplier:suppliers(*)')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre_comercial', { ascending: true })

  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  if (filters?.categoria) {
    query = query.eq('categoria', filters.categoria)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.search) {
    query = query.or(`nombre_comercial.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,material.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getCoffinUrn(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase
    .from('coffin_urns')
    .select('*, supplier:suppliers(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createCoffinUrn(input: CoffinUrnInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = coffinUrnSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data, error } = await supabase
    .from('coffin_urns')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/ataudes-urnas')
  return data
}

export async function updateCoffinUrn(id: string, input: Partial<CoffinUrnInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = coffinUrnSchema.partial().parse(input)

  const { data, error } = await supabase.from('coffin_urns').update(validated).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/ataudes-urnas')
  return data
}

export async function deleteCoffinUrn(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('coffin_urns').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar porque está siendo usado en servicios')
    }
    throw error
  }

  revalidatePath('/administracion/ataudes-urnas')
}
