'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { supplierSchema, type SupplierInput } from '@/lib/validations/catalogs'

export async function getSuppliers(filters?: {
  tipo_negocio?: string
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
    .from('suppliers')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('nombre', { ascending: true })

  if (filters?.tipo_negocio) {
    query = query.eq('tipo_negocio', filters.tipo_negocio)
  }

  if (filters?.estado_activo !== undefined) {
    query = query.eq('estado_activo', filters.estado_activo)
  }

  if (filters?.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,rut.ilike.%${filters.search}%,tipo_negocio.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getSupplier(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single()

  if (error) {
    throw error
  }

  return data
}

export async function createSupplier(input: SupplierInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = supplierSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/proveedores')
  return data
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = supplierSchema.partial().parse(input)

  const { data, error } = await supabase.from('suppliers').update(validated).eq('id', id).select().single()

  if (error) {
    throw error
  }

  revalidatePath('/administracion/proveedores')
  return data
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('suppliers').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar el proveedor porque tiene egresos asociados')
    }
    throw error
  }

  revalidatePath('/administracion/proveedores')
}
