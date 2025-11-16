'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
  service_id: z.string().uuid(),
  fecha_transaccion: z.string().default(() => new Date().toISOString().split('T')[0]),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('CLP'),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'seguro', 'cuota_mortuoria']),
  cuenta_destino: z.string().optional().nullable(),
  estado: z.enum(['pendiente', 'pagado', 'rechazado', 'reembolsado']).default('pendiente'),
  observaciones: z.string().optional().nullable(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

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
      service:services(id, numero_servicio, nombre_fallecido, nombre_responsable, total_final)
    `)
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('fecha_transaccion', { ascending: false })

  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id)
  }

  if (filters?.status) {
    query = query.eq('estado', filters.status)
  }

  if (filters?.payment_method) {
    query = query.eq('metodo_pago', filters.payment_method)
  }

  if (filters?.date_from) {
    query = query.gte('fecha_transaccion', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('fecha_transaccion', filters.date_to)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getTransactionStats() {
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

  // Get summary stats
  const { data: stats, error } = await supabase
    .from('transactions')
    .select('monto, estado, metodo_pago, fecha_transaccion')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (error) {
    throw error
  }

  // Calculate statistics
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisWeek = new Date(today.setDate(today.getDate() - today.getDay()))

  const totalPagado = stats
    .filter(t => t.estado === 'pagado')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const totalPendiente = stats
    .filter(t => t.estado === 'pendiente')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const pagosMes = stats
    .filter(t => t.estado === 'pagado' && new Date(t.fecha_transaccion) >= thisMonth)
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const byMethod = stats
    .filter(t => t.estado === 'pagado')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.metodo_pago] = (acc[t.metodo_pago] || 0) + Number(t.monto)
      return acc
    }, {})

  return {
    totalPagado,
    totalPendiente,
    pagosMes,
    cantidadTransacciones: stats.length,
    cantidadPagadas: stats.filter(t => t.estado === 'pagado').length,
    cantidadPendientes: stats.filter(t => t.estado === 'pendiente').length,
    byMethod,
  }
}

export async function createTransaction(input: TransactionInput) {
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
      service_id: validated.service_id,
      funeral_home_id: service.funeral_home_id,
      branch_id: service.branch_id,
      fecha_transaccion: validated.fecha_transaccion,
      monto: validated.monto,
      moneda: validated.moneda,
      metodo_pago: validated.metodo_pago,
      cuenta_destino: validated.cuenta_destino,
      estado: validated.estado,
      observaciones: validated.observaciones,
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

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = transactionSchema.partial().parse(input)

  const updateData: Record<string, any> = {}
  if (validated.fecha_transaccion) updateData.fecha_transaccion = validated.fecha_transaccion
  if (validated.monto) updateData.monto = validated.monto
  if (validated.moneda) updateData.moneda = validated.moneda
  if (validated.metodo_pago) updateData.metodo_pago = validated.metodo_pago
  if (validated.cuenta_destino !== undefined) updateData.cuenta_destino = validated.cuenta_destino
  if (validated.estado) updateData.estado = validated.estado
  if (validated.observaciones !== undefined) updateData.observaciones = validated.observaciones

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
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

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get transaction info first for revalidation
  const { data: transaction } = await supabase
    .from('transactions')
    .select('service_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/transacciones')
  if (transaction?.service_id) {
    revalidatePath(`/servicios/${transaction.service_id}`)
  }
}
