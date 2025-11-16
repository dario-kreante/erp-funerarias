'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRevenueStats() {
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

  // Get all transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('monto, estado, metodo_pago, fecha_transaccion')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (transError) throw transError

  // Get all expenses
  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('monto, fecha_egreso, categoria')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (expError) throw expError

  // Get service summary for revenue tracking
  const { data: serviceSummary, error: serviceError } = await supabase
    .from('service_summary')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)

  if (serviceError) throw serviceError

  // Calculate date ranges
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisYear = new Date(now.getFullYear(), 0, 1)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Revenue calculations
  const totalRevenue = transactions
    .filter(t => t.estado === 'pagado')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const revenueThisMonth = transactions
    .filter(t => t.estado === 'pagado' && new Date(t.fecha_transaccion) >= thisMonth)
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const revenueLastMonth = transactions
    .filter(t => {
      const date = new Date(t.fecha_transaccion)
      return t.estado === 'pagado' && date >= lastMonth && date < thisMonth
    })
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const revenueThisYear = transactions
    .filter(t => t.estado === 'pagado' && new Date(t.fecha_transaccion) >= thisYear)
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const revenueLast30Days = transactions
    .filter(t => t.estado === 'pagado' && new Date(t.fecha_transaccion) >= last30Days)
    .reduce((sum, t) => sum + Number(t.monto), 0)

  // Pending revenue
  const pendingRevenue = transactions
    .filter(t => t.estado === 'pendiente')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  // Outstanding from services
  const outstandingBalance = serviceSummary.reduce((sum, s) => sum + Number(s.saldo || 0), 0)

  // Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.monto), 0)

  const expensesThisMonth = expenses
    .filter(e => new Date(e.fecha_egreso) >= thisMonth)
    .reduce((sum, e) => sum + Number(e.monto), 0)

  const expensesThisYear = expenses
    .filter(e => new Date(e.fecha_egreso) >= thisYear)
    .reduce((sum, e) => sum + Number(e.monto), 0)

  // Profit calculations
  const grossProfitMonth = revenueThisMonth - expensesThisMonth
  const grossProfitYear = revenueThisYear - expensesThisYear

  // Payment method breakdown
  const paymentMethodBreakdown = transactions
    .filter(t => t.estado === 'pagado')
    .reduce((acc: Record<string, { count: number; amount: number }>, t) => {
      if (!acc[t.metodo_pago]) {
        acc[t.metodo_pago] = { count: 0, amount: 0 }
      }
      acc[t.metodo_pago].count++
      acc[t.metodo_pago].amount += Number(t.monto)
      return acc
    }, {})

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }> = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthName = monthStart.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })

    const revenue = transactions
      .filter(t => {
        const date = new Date(t.fecha_transaccion)
        return t.estado === 'pagado' && date >= monthStart && date <= monthEnd
      })
      .reduce((sum, t) => sum + Number(t.monto), 0)

    const expense = expenses
      .filter(e => {
        const date = new Date(e.fecha_egreso)
        return date >= monthStart && date <= monthEnd
      })
      .reduce((sum, e) => sum + Number(e.monto), 0)

    monthlyRevenue.push({ month: monthName, revenue, expenses: expense })
  }

  // Service stats
  const servicesCompleted = serviceSummary.filter(
    s => s.estado === 'completado' || s.estado === 'cerrado'
  ).length
  const servicesPending = serviceSummary.filter(
    s => s.estado === 'en_proceso' || s.estado === 'pendiente'
  ).length

  // Average transaction value
  const paidTransactions = transactions.filter(t => t.estado === 'pagado')
  const averageTransactionValue =
    paidTransactions.length > 0 ? totalRevenue / paidTransactions.length : 0

  // Average service value
  const averageServiceValue =
    serviceSummary.length > 0
      ? serviceSummary.reduce((sum, s) => sum + Number(s.total_final || 0), 0) / serviceSummary.length
      : 0

  // Collection rate
  const totalBilled = serviceSummary.reduce((sum, s) => sum + Number(s.total_final || 0), 0)
  const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0

  return {
    revenue: {
      total: totalRevenue,
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      thisYear: revenueThisYear,
      last30Days: revenueLast30Days,
      pending: pendingRevenue,
      outstanding: outstandingBalance,
    },
    expenses: {
      total: totalExpenses,
      thisMonth: expensesThisMonth,
      thisYear: expensesThisYear,
    },
    profit: {
      thisMonth: grossProfitMonth,
      thisYear: grossProfitYear,
    },
    paymentMethods: paymentMethodBreakdown,
    monthlyTrend: monthlyRevenue,
    services: {
      total: serviceSummary.length,
      completed: servicesCompleted,
      pending: servicesPending,
      averageValue: averageServiceValue,
    },
    metrics: {
      averageTransactionValue,
      collectionRate,
      totalTransactions: paidTransactions.length,
    },
  }
}
