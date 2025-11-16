'use client'

import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'

interface PaymentMethodData {
  [method: string]: {
    count: number
    amount: number
  }
}

interface PaymentMethodChartProps {
  data: PaymentMethodData
}

const methodLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  cheque: 'Cheque',
  seguro: 'Seguro',
  cuota_mortuoria: 'Cuota Mortuoria',
}

const methodColors: Record<string, string> = {
  efectivo: 'bg-green-500',
  transferencia: 'bg-blue-500',
  tarjeta: 'bg-purple-500',
  cheque: 'bg-yellow-500',
  seguro: 'bg-orange-500',
  cuota_mortuoria: 'bg-pink-500',
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const totalAmount = Object.values(data).reduce((sum, item) => sum + item.amount, 0)
  const sortedMethods = Object.entries(data).sort(([, a], [, b]) => b.amount - a.amount)

  if (sortedMethods.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Métodos de Pago</h3>
        <p className="text-center text-sm text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Métodos de Pago</h3>

      {/* Pie chart representation */}
      <div className="mb-6 flex items-center justify-center">
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {(() => {
              let currentAngle = 0
              return sortedMethods.map(([method, item]) => {
                const percentage = (item.amount / totalAmount) * 100
                const angle = (percentage / 100) * 360
                const startAngle = currentAngle
                currentAngle += angle

                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180)
                const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180)
                const largeArcFlag = angle > 180 ? 1 : 0

                return (
                  <path
                    key={method}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    className={methodColors[method] || 'bg-gray-500'}
                    fill="currentColor"
                  />
                )
              })
            })()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-bold">{formatCurrencyCompact(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend and details */}
      <div className="space-y-3">
        {sortedMethods.map(([method, item]) => {
          const percentage = ((item.amount / totalAmount) * 100).toFixed(1)
          return (
            <div key={method} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${methodColors[method] || 'bg-gray-500'}`} />
                <span className="text-sm text-gray-700">{methodLabels[method] || method}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrencyCompact(item.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} trans. ({percentage}%)
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
