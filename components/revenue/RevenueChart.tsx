'use client'

import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
}

interface RevenueChartProps {
  data: MonthlyData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.revenue, d.expenses)),
    1 // Prevent division by zero
  )

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Tendencia Mensual</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const revenuePercent = (item.revenue / maxValue) * 100
          const expensePercent = (item.expenses / maxValue) * 100
          const profit = item.revenue - item.expenses

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.month}</span>
                <span
                  className={
                    profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'
                  }
                >
                  {profit >= 0 ? '+' : ''}
                  {formatCurrencyCompact(profit)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-full rounded bg-gray-100">
                    <div
                      className="absolute left-0 top-0 h-full rounded bg-green-500 transition-all duration-500"
                      style={{ width: `${revenuePercent}%` }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                      {formatCurrencyCompact(item.revenue)}
                    </span>
                  </div>
                  <span className="w-16 text-xs text-green-600">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-full rounded bg-gray-100">
                    <div
                      className="absolute left-0 top-0 h-full rounded bg-red-400 transition-all duration-500"
                      style={{ width: `${expensePercent}%` }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                      {formatCurrencyCompact(item.expenses)}
                    </span>
                  </div>
                  <span className="w-16 text-xs text-red-500">Egresos</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
