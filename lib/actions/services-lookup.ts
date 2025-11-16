'use server'

import { createClient } from '@/lib/supabase/server'

export async function getServicesForSelect() {
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

  const { data, error } = await supabase
    .from('services')
    .select('id, numero_servicio, nombre_fallecido, nombre_responsable, total_final')
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw error
  }

  return data
}
