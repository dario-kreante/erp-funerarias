'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { vehicleSchema, type VehicleInput } from '@/lib/validations/catalogs'

export async function getVehicles(filters?: {
  estado?: 'disponible' | 'en_mantenimiento'
  tipo_vehiculo?: string
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
    .from('vehicles')
    .select('*, branch:branches(*)')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('placa', { ascending: true })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.tipo_vehiculo) {
    query = query.eq('tipo_vehiculo', filters.tipo_vehiculo)
  }

  if (filters?.search) {
    query = query.or(`placa.ilike.%${filters.search}%,tipo_vehiculo.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getVehicle(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase.from('vehicles').select('*, branch:branches(*)').eq('id', id).single()

  if (error) {
    throw error
  }

  return data
}

export async function createVehicle(input: VehicleInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = vehicleSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un vehículo con esta placa')
    }
    throw error
  }

  revalidatePath('/administracion/vehiculos')
  return data
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = vehicleSchema.partial().parse(input)

  const { data, error } = await supabase.from('vehicles').update(validated).eq('id', id).select().single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un vehículo con esta placa')
    }
    throw error
  }

  revalidatePath('/administracion/vehiculos')
  return data
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar el vehículo porque está siendo usado en servicios')
    }
    throw error
  }

  revalidatePath('/administracion/vehiculos')
}
