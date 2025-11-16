'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const expenseSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  expense_date: z.string().default(new Date().toISOString().split('T')[0]),
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().positive('El monto debe ser positivo'),
  category: z.string().optional().nullable(),
  tax_info: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  status: z.enum(['con_factura', 'pendiente_factura', 'sin_factura']).default('sin_factura'),
})

export async function getExpenses(filters?: {
  service_id?: string
  status?: string
  category?: string
  date_from?: string
  date_to?: string
  supplier_id?: string
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
    .from('expenses')
    .select(`
      *,
      service:services(*),
      supplier:suppliers(*)
    `)
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('expense_date', { ascending: false })

  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.date_from) {
    query = query.gte('expense_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('expense_date', filters.date_to)
  }

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function createExpense(input: z.infer<typeof expenseSchema>) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = expenseSchema.parse(input)

  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  // Get branch_id from service or use first accessible branch
  let branch_id: string | null = null
  if (validated.service_id) {
    const { data: service } = await supabase
      .from('services')
      .select('branch_id')
      .eq('id', validated.service_id)
      .single()
    branch_id = service?.branch_id || null
  } else {
    const { data: userBranches } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', user.id)
      .limit(1)
    branch_id = userBranches?.[0]?.branch_id || null
  }

  if (!branch_id) {
    throw new Error('No se pudo determinar la sucursal')
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...validated,
      funeral_home_id: profile.funeral_home_id,
      branch_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/egresos')
  if (validated.service_id) {
    revalidatePath(`/servicios/${validated.service_id}`)
  }
  return data
}

export async function updateExpense(id: string, input: Partial<z.infer<typeof expenseSchema>>) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = expenseSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('expenses')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/egresos')
  if (data.service_id) {
    revalidatePath(`/servicios/${data.service_id}`)
  }
  return data
}

