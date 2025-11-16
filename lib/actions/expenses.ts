'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const expenseSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  fecha_egreso: z.string().default(() => new Date().toISOString().split('T')[0]),
  supplier_id: z.string().uuid().optional().nullable(),
  nombre_proveedor: z.string().optional().nullable(),
  concepto: z.string().min(1, 'El concepto es requerido'),
  monto: z.number().positive('El monto debe ser positivo'),
  categoria: z.enum([
    'insumos',
    'servicios_externos',
    'combustible',
    'mantenimiento',
    'servicios_publicos',
    'arriendos',
    'honorarios',
    'impuestos',
    'seguros',
    'otros',
  ]).optional().nullable(),
  info_impuestos: z.string().optional().nullable(),
  numero_factura: z.string().optional().nullable(),
  estado: z.enum(['con_factura', 'pendiente_factura', 'sin_factura']).default('sin_factura'),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

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
      service:services(id, numero_servicio, nombre_fallecido),
      supplier:suppliers(id, nombre)
    `)
    .eq('funeral_home_id', profile.funeral_home_id)
    .order('fecha_egreso', { ascending: false })

  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id)
  }

  if (filters?.status) {
    query = query.eq('estado', filters.status)
  }

  if (filters?.category) {
    query = query.eq('categoria', filters.category)
  }

  if (filters?.date_from) {
    query = query.gte('fecha_egreso', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('fecha_egreso', filters.date_to)
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

export async function getExpenseStats() {
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

  const { data: stats, error } = await supabase
    .from('expenses')
    .select('monto, estado, categoria, fecha_egreso')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (error) {
    throw error
  }

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const totalEgresos = stats.reduce((sum, e) => sum + Number(e.monto), 0)

  const egresosMes = stats
    .filter(e => new Date(e.fecha_egreso) >= thisMonth)
    .reduce((sum, e) => sum + Number(e.monto), 0)

  const sinFactura = stats.filter(e => e.estado === 'sin_factura').length
  const pendienteFactura = stats.filter(e => e.estado === 'pendiente_factura').length

  const byCategory = stats.reduce((acc: Record<string, number>, e) => {
    const cat = e.categoria || 'otros'
    acc[cat] = (acc[cat] || 0) + Number(e.monto)
    return acc
  }, {})

  return {
    totalEgresos,
    egresosMes,
    cantidadEgresos: stats.length,
    sinFactura,
    pendienteFactura,
    byCategory,
  }
}

export async function createExpense(input: ExpenseInput) {
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
      service_id: validated.service_id,
      funeral_home_id: profile.funeral_home_id,
      branch_id,
      fecha_egreso: validated.fecha_egreso,
      supplier_id: validated.supplier_id,
      nombre_proveedor: validated.nombre_proveedor,
      concepto: validated.concepto,
      monto: validated.monto,
      categoria: validated.categoria,
      info_impuestos: validated.info_impuestos,
      numero_factura: validated.numero_factura,
      estado: validated.estado,
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

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const validated = expenseSchema.partial().parse(input)

  const updateData: Record<string, any> = {}
  if (validated.service_id !== undefined) updateData.service_id = validated.service_id
  if (validated.fecha_egreso) updateData.fecha_egreso = validated.fecha_egreso
  if (validated.supplier_id !== undefined) updateData.supplier_id = validated.supplier_id
  if (validated.nombre_proveedor !== undefined) updateData.nombre_proveedor = validated.nombre_proveedor
  if (validated.concepto) updateData.concepto = validated.concepto
  if (validated.monto) updateData.monto = validated.monto
  if (validated.categoria !== undefined) updateData.categoria = validated.categoria
  if (validated.info_impuestos !== undefined) updateData.info_impuestos = validated.info_impuestos
  if (validated.numero_factura !== undefined) updateData.numero_factura = validated.numero_factura
  if (validated.estado) updateData.estado = validated.estado

  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
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

export async function deleteExpense(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get expense info first for revalidation
  const { data: expense } = await supabase
    .from('expenses')
    .select('service_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/egresos')
  if (expense?.service_id) {
    revalidatePath(`/servicios/${expense.service_id}`)
  }
}
