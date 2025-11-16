'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cemeteryCrematoriumSchema, type CemeteryCrematoriumInput } from '@/lib/validations/catalogs'

export async function getCemeteryCrematoriums(filters?: {
  tipo?: 'cementerio' | 'crematorio'
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
    .from('cemetery_crematoriums')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre', { ascending: true })

  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,direccion.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getCemeteryCrematorium(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase.from('cemetery_crematoriums').select('*').eq('id', id).single()

  if (error) {
    throw error
  }

  return data
}

export async function createCemeteryCrematorium(input: CemeteryCrematoriumInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = cemeteryCrematoriumSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data, error } = await supabase
    .from('cemetery_crematoriums')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/cementerios-crematorios')
  return data
}

export async function updateCemeteryCrematorium(id: string, input: Partial<CemeteryCrematoriumInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = cemeteryCrematoriumSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('cemetery_crematoriums')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/cementerios-crematorios')
  return data
}

export async function deleteCemeteryCrematorium(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('cemetery_crematoriums').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar porque está siendo usado en servicios')
    }
    throw error
  }

  revalidatePath('/administracion/cementerios-crematorios')
}
