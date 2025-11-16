'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
  service_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('CLP'),
  payment_method: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'seguro', 'cuota_mortuoria']),
  account_destination: z.string().optional().nullable(),
  status: z.enum(['pendiente', 'pagado', 'rechazado', 'reembolsado']).default('pendiente'),
  observations: z.string().optional().nullable(),
})

export async function getTransactions(filters?: {
  service_id?: string
  status?: string
  payment_method?: string
  date_from?: string
  date_to?: string
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
    .from('transactions')
    .select(`
      *,
      service:services(*)
    `)
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('transaction_date', { ascending: false })

  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.payment_method) {
    query = query.eq('payment_method', filters.payment_method)
  }

  if (filters?.date_from) {
    query = query.gte('transaction_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('transaction_date', filters.date_to)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function createTransaction(input: z.infer<typeof transactionSchema>) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = transactionSchema.parse(input)

  // Get service to get funeral_home_id and branch_id
  const { data: service } = await supabase
    .from('services')
    .select('funeral_home_id, branch_id')
    .eq('id', validated.service_id)
    .single()

  if (!service) {
    throw new Error('Servicio no encontrado')
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...validated,
      funeral_home_id: service.funeral_home_id,
      branch_id: service.branch_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/transacciones')
  revalidatePath(`/servicios/${validated.service_id}`)
  return data
}

export async function updateTransaction(id: string, input: Partial<z.infer<typeof transactionSchema>>) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = transactionSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('transactions')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/transacciones')
  if (data.service_id) {
    revalidatePath(`/servicios/${data.service_id}`)
  }
  return data
}

