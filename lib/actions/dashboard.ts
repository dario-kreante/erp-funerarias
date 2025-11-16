'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type interfaces for Supabase query results
interface AmountRecord {
  monto: number
}

interface ServiceRecord {
  tipo_servicio: string
}

interface ActivityLogRecord {
  id: string
  entity_type: string
  entity_id: string
  action: string
  detalles: Record<string, unknown> | null
  created_at: string
  user_id: string | null
  profiles: { nombre_completo: string } | null
}

interface OverduePaymentRecord {
  id: string
  numero_transaccion: string
  monto: number
  fecha_transaccion: string
  service: { numero_servicio: string; nombre_fallecido: string } | null
}

interface PendingQuotaRecord {
  id: string
  estado: string
  fecha_solicitud: string | null
  service: { id: string; numero_servicio: string; nombre_fallecido: string } | null
}

interface UnfinishedServiceRecord {
  id: string
  numero_servicio: string
  nombre_fallecido: string
  created_at: string
}

export interface DashboardKPIs {
  serviciosActivos: number
  serviciosCompletados: number
  ingresosMes: number
  egresosMes: number
  cobrosPendientes: number
  ingresosVsMesAnterior: number
  serviciosVsMesAnterior: number
}

export interface RevenueTrendData {
  mes: string
  ingresos: number
  egresos: number
}

export interface ServicesByTypeData {
  tipo: string
  cantidad: number
  label: string
}

export interface ActivityItem {
  id: string
  tipo: string
  descripcion: string
  fecha: string
  usuario: string | null
  entidad: string
  entidadId: string
}

export interface AlertItem {
  id: string
  tipo: 'documento_pendiente' | 'pago_vencido' | 'cuota_pendiente' | 'servicio_sin_finalizar'
  titulo: string
  descripcion: string
  fecha: string
  prioridad: 'alta' | 'media' | 'baja'
  enlace?: string
}

export interface DashboardData {
  kpis: DashboardKPIs
  revenueTrend: RevenueTrendData[]
  servicesByType: ServicesByTypeData[]
  recentActivity: ActivityItem[]
  alerts: AlertItem[]
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  inhumacion: 'Inhumación',
  cremacion: 'Cremación',
  traslado_nacional: 'Traslado Nacional',
  traslado_internacional: 'Traslado Internacional',
  solo_velatorio: 'Solo Velatorio'
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Get user's funeral_home_id and accessible branches
  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { data: userBranches } = await supabase
    .from('user_branches')
    .select('branch_id')
    .eq('user_id', user.id)

  const branchIds = userBranches?.map(ub => ub.branch_id) || []

  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)
  const previousMonthStart = startOfMonth(subMonths(now, 1))
  const previousMonthEnd = endOfMonth(subMonths(now, 1))

  // Fetch all data in parallel
  const [
    kpisData,
    revenueTrendData,
    servicesByTypeData,
    activityData,
    alertsData
  ] = await Promise.all([
    fetchKPIs(supabase, profile.funeral_home_id, branchIds, currentMonthStart, currentMonthEnd, previousMonthStart, previousMonthEnd),
    fetchRevenueTrend(supabase, profile.funeral_home_id, branchIds),
    fetchServicesByType(supabase, profile.funeral_home_id, branchIds),
    fetchRecentActivity(supabase, profile.funeral_home_id, branchIds),
    fetchAlerts(supabase, profile.funeral_home_id, branchIds)
  ])

  return {
    kpis: kpisData,
    revenueTrend: revenueTrendData,
    servicesByType: servicesByTypeData,
    recentActivity: activityData,
    alerts: alertsData
  }
}

async function fetchKPIs(
  supabase: SupabaseClient,
  funeralHomeId: string,
  branchIds: string[],
  currentMonthStart: Date,
  currentMonthEnd: Date,
  previousMonthStart: Date,
  previousMonthEnd: Date
): Promise<DashboardKPIs> {
  // Active services (en_ejecucion, confirmado)
  let activeServicesQuery = supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', funeralHomeId)
    .in('estado', ['confirmado', 'en_ejecucion'])

  if (branchIds.length > 0) {
    activeServicesQuery = activeServicesQuery.in('branch_id', branchIds)
  }

  const { count: serviciosActivos } = await activeServicesQuery

  // Completed services this month
  let completedServicesQuery = supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', funeralHomeId)
    .in('estado', ['finalizado', 'cerrado'])
    .gte('updated_at', currentMonthStart.toISOString())
    .lte('updated_at', currentMonthEnd.toISOString())

  if (branchIds.length > 0) {
    completedServicesQuery = completedServicesQuery.in('branch_id', branchIds)
  }

  const { count: serviciosCompletados } = await completedServicesQuery

  // Previous month completed services
  let previousCompletedQuery = supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('funeral_home_id', funeralHomeId)
    .in('estado', ['finalizado', 'cerrado'])
    .gte('updated_at', previousMonthStart.toISOString())
    .lte('updated_at', previousMonthEnd.toISOString())

  if (branchIds.length > 0) {
    previousCompletedQuery = previousCompletedQuery.in('branch_id', branchIds)
  }

  const { count: previousServiciosCompletados } = await previousCompletedQuery

  // Revenue this month (paid transactions)
  let revenueQuery = supabase
    .from('transactions')
    .select('monto')
    .eq('funeral_home_id', funeralHomeId)
    .eq('estado', 'pagado')
    .gte('fecha_transaccion', currentMonthStart.toISOString().split('T')[0])
    .lte('fecha_transaccion', currentMonthEnd.toISOString().split('T')[0])

  if (branchIds.length > 0) {
    revenueQuery = revenueQuery.in('branch_id', branchIds)
  }

  const { data: revenueData } = await revenueQuery
  const ingresosMes = (revenueData as AmountRecord[] | null)?.reduce((sum: number, t) => sum + (t.monto || 0), 0) || 0

  // Previous month revenue
  let previousRevenueQuery = supabase
    .from('transactions')
    .select('monto')
    .eq('funeral_home_id', funeralHomeId)
    .eq('estado', 'pagado')
    .gte('fecha_transaccion', previousMonthStart.toISOString().split('T')[0])
    .lte('fecha_transaccion', previousMonthEnd.toISOString().split('T')[0])

  if (branchIds.length > 0) {
    previousRevenueQuery = previousRevenueQuery.in('branch_id', branchIds)
  }

  const { data: previousRevenueData } = await previousRevenueQuery
  const previousIngresos = (previousRevenueData as AmountRecord[] | null)?.reduce((sum: number, t) => sum + (t.monto || 0), 0) || 0

  // Expenses this month
  let expensesQuery = supabase
    .from('expenses')
    .select('monto')
    .eq('funeral_home_id', funeralHomeId)
    .gte('fecha_egreso', currentMonthStart.toISOString().split('T')[0])
    .lte('fecha_egreso', currentMonthEnd.toISOString().split('T')[0])

  if (branchIds.length > 0) {
    expensesQuery = expensesQuery.in('branch_id', branchIds)
  }

  const { data: expensesData } = await expensesQuery
  const egresosMes = (expensesData as AmountRecord[] | null)?.reduce((sum: number, e) => sum + (e.monto || 0), 0) || 0

  // Pending collections (pending transactions)
  let pendingQuery = supabase
    .from('transactions')
    .select('monto')
    .eq('funeral_home_id', funeralHomeId)
    .eq('estado', 'pendiente')

  if (branchIds.length > 0) {
    pendingQuery = pendingQuery.in('branch_id', branchIds)
  }

  const { data: pendingData } = await pendingQuery
  const cobrosPendientes = (pendingData as AmountRecord[] | null)?.reduce((sum: number, t) => sum + (t.monto || 0), 0) || 0

  // Calculate percentage changes
  const ingresosVsMesAnterior = previousIngresos > 0
    ? Math.round(((ingresosMes - previousIngresos) / previousIngresos) * 100)
    : 0

  const serviciosVsMesAnterior = (previousServiciosCompletados || 0) > 0
    ? Math.round((((serviciosCompletados || 0) - (previousServiciosCompletados || 0)) / (previousServiciosCompletados || 0)) * 100)
    : 0

  return {
    serviciosActivos: serviciosActivos || 0,
    serviciosCompletados: serviciosCompletados || 0,
    ingresosMes,
    egresosMes,
    cobrosPendientes,
    ingresosVsMesAnterior,
    serviciosVsMesAnterior
  }
}

async function fetchRevenueTrend(
  supabase: SupabaseClient,
  funeralHomeId: string,
  branchIds: string[]
): Promise<RevenueTrendData[]> {
  const months: RevenueTrendData[] = []
  const now = new Date()

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    // Revenue for this month
    let revenueQuery = supabase
      .from('transactions')
      .select('monto')
      .eq('funeral_home_id', funeralHomeId)
      .eq('estado', 'pagado')
      .gte('fecha_transaccion', monthStart.toISOString().split('T')[0])
      .lte('fecha_transaccion', monthEnd.toISOString().split('T')[0])

    if (branchIds.length > 0) {
      revenueQuery = revenueQuery.in('branch_id', branchIds)
    }

    const { data: revenueData } = await revenueQuery
    const ingresos = (revenueData as AmountRecord[] | null)?.reduce((sum: number, t) => sum + (t.monto || 0), 0) || 0

    // Expenses for this month
    let expensesQuery = supabase
      .from('expenses')
      .select('monto')
      .eq('funeral_home_id', funeralHomeId)
      .gte('fecha_egreso', monthStart.toISOString().split('T')[0])
      .lte('fecha_egreso', monthEnd.toISOString().split('T')[0])

    if (branchIds.length > 0) {
      expensesQuery = expensesQuery.in('branch_id', branchIds)
    }

    const { data: expensesData } = await expensesQuery
    const egresos = (expensesData as AmountRecord[] | null)?.reduce((sum: number, e) => sum + (e.monto || 0), 0) || 0

    months.push({
      mes: format(monthDate, 'MMM', { locale: es }),
      ingresos,
      egresos
    })
  }

  return months
}

async function fetchServicesByType(
  supabase: SupabaseClient,
  funeralHomeId: string,
  branchIds: string[]
): Promise<ServicesByTypeData[]> {
  const now = new Date()
  const threeMonthsAgo = subMonths(now, 3)

  let query = supabase
    .from('services')
    .select('tipo_servicio')
    .eq('funeral_home_id', funeralHomeId)
    .gte('created_at', threeMonthsAgo.toISOString())

  if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  const { data } = await query

  // Count by type
  const countByType: Record<string, number> = {}
  ;(data as ServiceRecord[] | null)?.forEach((service) => {
    const tipo = service.tipo_servicio
    countByType[tipo] = (countByType[tipo] || 0) + 1
  })

  return Object.entries(countByType).map(([tipo, cantidad]) => ({
    tipo,
    cantidad,
    label: SERVICE_TYPE_LABELS[tipo] || tipo
  }))
}

async function fetchRecentActivity(
  supabase: SupabaseClient,
  funeralHomeId: string,
  branchIds: string[]
): Promise<ActivityItem[]> {
  let query = supabase
    .from('activity_logs')
    .select(`
      id,
      entity_type,
      entity_id,
      action,
      detalles,
      created_at,
      user_id,
      profiles:user_id (nombre_completo)
    `)
    .eq('funeral_home_id', funeralHomeId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  const { data } = await query

  return ((data as ActivityLogRecord[] | null) || []).map((activity) => {
    let descripcion = ''
    switch (activity.action) {
      case 'CREATE':
        descripcion = `Se creó ${getEntityName(activity.entity_type)}`
        break
      case 'UPDATE':
        descripcion = `Se actualizó ${getEntityName(activity.entity_type)}`
        break
      case 'DELETE':
        descripcion = `Se eliminó ${getEntityName(activity.entity_type)}`
        break
      default:
        descripcion = `${activity.action} en ${getEntityName(activity.entity_type)}`
    }

    return {
      id: activity.id,
      tipo: activity.action,
      descripcion,
      fecha: activity.created_at,
      usuario: activity.profiles?.nombre_completo || null,
      entidad: activity.entity_type,
      entidadId: activity.entity_id
    }
  })
}

function getEntityName(entityType: string): string {
  const names: Record<string, string> = {
    service: 'servicio',
    transaction: 'transacción',
    expense: 'egreso',
    collaborator: 'colaborador',
    document: 'documento',
    mortuary_quota: 'cuota mortuoria'
  }
  return names[entityType] || entityType
}

async function fetchAlerts(
  supabase: SupabaseClient,
  funeralHomeId: string,
  branchIds: string[]
): Promise<AlertItem[]> {
  const alerts: AlertItem[] = []
  const now = new Date()

  // 1. Overdue payments (pending transactions older than 30 days)
  const thirtyDaysAgo = subMonths(now, 1)
  let overdueQuery = supabase
    .from('transactions')
    .select(`
      id,
      numero_transaccion,
      monto,
      fecha_transaccion,
      service:services(numero_servicio, nombre_fallecido)
    `)
    .eq('funeral_home_id', funeralHomeId)
    .eq('estado', 'pendiente')
    .lte('fecha_transaccion', thirtyDaysAgo.toISOString().split('T')[0])
    .limit(5)

  if (branchIds.length > 0) {
    overdueQuery = overdueQuery.in('branch_id', branchIds)
  }

  const { data: overduePayments } = await overdueQuery

  ;(overduePayments as OverduePaymentRecord[] | null)?.forEach((payment) => {
    alerts.push({
      id: `overdue-${payment.id}`,
      tipo: 'pago_vencido',
      titulo: 'Pago vencido',
      descripcion: `Transacción ${payment.numero_transaccion} - Servicio ${payment.service?.numero_servicio || 'N/A'}`,
      fecha: payment.fecha_transaccion,
      prioridad: 'alta',
      enlace: `/transacciones/${payment.id}`
    })
  })

  // 2. Pending mortuary quotas
  const quotasQuery = supabase
    .from('mortuary_quotas')
    .select(`
      id,
      estado,
      fecha_solicitud,
      service:services(id, numero_servicio, nombre_fallecido)
    `)
    .in('estado', ['no_iniciada', 'en_preparacion', 'ingresada'])
    .limit(5)

  const { data: pendingQuotas } = await quotasQuery

  ;(pendingQuotas as PendingQuotaRecord[] | null)?.forEach((quota) => {
    alerts.push({
      id: `quota-${quota.id}`,
      tipo: 'cuota_pendiente',
      titulo: 'Cuota mortuoria pendiente',
      descripcion: `Servicio ${quota.service?.numero_servicio || 'N/A'} - Estado: ${quota.estado}`,
      fecha: quota.fecha_solicitud || new Date().toISOString(),
      prioridad: 'media',
      enlace: `/servicios/${quota.service?.id}`
    })
  })

  // 3. Services without finalization (active for more than 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  let unfinishedQuery = supabase
    .from('services')
    .select('id, numero_servicio, nombre_fallecido, created_at')
    .eq('funeral_home_id', funeralHomeId)
    .in('estado', ['confirmado', 'en_ejecucion'])
    .lte('created_at', sevenDaysAgo.toISOString())
    .limit(5)

  if (branchIds.length > 0) {
    unfinishedQuery = unfinishedQuery.in('branch_id', branchIds)
  }

  const { data: unfinishedServices } = await unfinishedQuery

  ;(unfinishedServices as UnfinishedServiceRecord[] | null)?.forEach((service) => {
    alerts.push({
      id: `unfinished-${service.id}`,
      tipo: 'servicio_sin_finalizar',
      titulo: 'Servicio sin finalizar',
      descripcion: `${service.numero_servicio} - ${service.nombre_fallecido}`,
      fecha: service.created_at,
      prioridad: 'baja',
      enlace: `/servicios/${service.id}`
    })
  })

  // Sort by priority
  const priorityOrder = { alta: 0, media: 1, baja: 2 }
  alerts.sort((a, b) => priorityOrder[a.prioridad] - priorityOrder[b.prioridad])

  return alerts.slice(0, 10)
}
