'use client'

import { formatCurrency, formatCurrencyCompact, formatPercentage } from '@/lib/utils/currency'
import { RevenueChart } from './RevenueChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import {
  TrendUp01,
  TrendDown01,
  CurrencyDollarCircle,
  ReceiptCheck,
  Clock,
  BarChart01
} from '@untitledui/icons'

interface RevenueStats {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    thisYear: number
    last30Days: number
    pending: number
    outstanding: number
  }
  expenses: {
    total: number
    thisMonth: number
    thisYear: number
  }
  profit: {
    thisMonth: number
    thisYear: number
  }
  paymentMethods: Record<string, { count: number; amount: number }>
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number }>
  services: {
    total: number
    completed: number
    pending: number
    averageValue: number
  }
  metrics: {
    averageTransactionValue: number
    collectionRate: number
    totalTransactions: number
  }
}

interface RevenueDashboardProps {
  stats: RevenueStats
}

export function RevenueDashboard({ stats }: RevenueDashboardProps) {
  const monthOverMonthChange = stats.revenue.lastMonth > 0
    ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventas y Revenue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dashboard financiero y análisis de ingresos
        </p>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Ingresos del Mes</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrencyCompact(stats.revenue.thisMonth)}</p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {monthOverMonthChange >= 0 ? (
                  <>
                    <TrendUp01 className="h-4 w-4" />
                    <span>+{formatPercentage(monthOverMonthChange)} vs mes anterior</span>
                  </>
                ) : (
                  <>
                    <TrendDown01 className="h-4 w-4" />
                    <span>{formatPercentage(monthOverMonthChange)} vs mes anterior</span>
                  </>
                )}
              </div>
            </div>
            <CurrencyDollarCircle className="h-12 w-12 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Ingresos del Año</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrencyCompact(stats.revenue.thisYear)}</p>
              <p className="mt-2 text-sm opacity-75">
                Promedio: {formatCurrencyCompact(stats.revenue.thisYear / 12)}/mes
              </p>
            </div>
            <BarChart01 className="h-12 w-12 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Por Cobrar</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrencyCompact(stats.revenue.outstanding)}</p>
              <p className="mt-2 text-sm opacity-75">
                {stats.revenue.pending > 0 && `${formatCurrencyCompact(stats.revenue.pending)} pendiente`}
              </p>
            </div>
            <Clock className="h-12 w-12 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Utilidad del Mes</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrencyCompact(stats.profit.thisMonth)}</p>
              <p className="mt-2 text-sm opacity-75">
                Año: {formatCurrencyCompact(stats.profit.thisYear)}
              </p>
            </div>
            <ReceiptCheck className="h-12 w-12 opacity-30" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Tasa de Cobranza</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPercentage(stats.metrics.collectionRate)}
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(stats.metrics.collectionRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Ticket Promedio</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(stats.metrics.averageTransactionValue)}
          </p>
          <p className="text-xs text-gray-400">{stats.metrics.totalTransactions} transacciones</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Valor Promedio Servicio</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(stats.services.averageValue)}
          </p>
          <p className="text-xs text-gray-400">{stats.services.total} servicios</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Servicios Activos</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.services.pending}</p>
          <p className="text-xs text-gray-400">{stats.services.completed} completados</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={stats.monthlyTrend} />
        <PaymentMethodChart data={stats.paymentMethods} />
      </div>

      {/* Financial Summary Table */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Resumen Financiero</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Concepto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Este Mes
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Este Año
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acumulado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Ingresos Brutos</td>
                <td className="px-4 py-3 text-right text-sm text-green-600">
                  {formatCurrency(stats.revenue.thisMonth)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-green-600">
                  {formatCurrency(stats.revenue.thisYear)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-green-600">
                  {formatCurrency(stats.revenue.total)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Total Egresos</td>
                <td className="px-4 py-3 text-right text-sm text-red-600">
                  -{formatCurrency(stats.expenses.thisMonth)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-600">
                  -{formatCurrency(stats.expenses.thisYear)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-600">
                  -{formatCurrency(stats.expenses.total)}
                </td>
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900">Utilidad Bruta</td>
                <td className={`px-4 py-3 text-right text-sm ${stats.profit.thisMonth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(stats.profit.thisMonth)}
                </td>
                <td className={`px-4 py-3 text-right text-sm ${stats.profit.thisYear >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(stats.profit.thisYear)}
                </td>
                <td className={`px-4 py-3 text-right text-sm ${(stats.revenue.total - stats.expenses.total) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(stats.revenue.total - stats.expenses.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Collections Alert */}
      {stats.revenue.outstanding > 0 && (
        <div className="rounded-lg bg-yellow-50 p-4 shadow">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Saldos Pendientes</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Hay <strong>{formatCurrency(stats.revenue.outstanding)}</strong> en saldos pendientes de cobro.
                Considera dar seguimiento a estos pagos para mejorar el flujo de caja.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
