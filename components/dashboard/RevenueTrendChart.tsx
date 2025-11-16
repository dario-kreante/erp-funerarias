'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatCurrencyCompact } from '@/lib/utils'
import type { RevenueTrendData } from '@/lib/actions/dashboard'

interface RevenueTrendChartProps {
  data: RevenueTrendData[]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 font-medium text-gray-900">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrencyCompact(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <Card padding="none" className="h-full">
      <div className="p-6">
        <CardHeader
          title="Tendencia de Ingresos y Egresos"
          description="Comparativa de los últimos 6 meses"
          className="border-0 pb-0"
        />
      </div>
      <CardContent className="mt-0 h-[300px] px-6 pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#37b24d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#37b24d" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e03131" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e03131" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis
              dataKey="mes"
              stroke="#868e96"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#dee2e6' }}
            />
            <YAxis
              stroke="#868e96"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#dee2e6' }}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '14px' }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke="#37b24d"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIngresos)"
            />
            <Area
              type="monotone"
              dataKey="egresos"
              name="Egresos"
              stroke="#e03131"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEgresos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
