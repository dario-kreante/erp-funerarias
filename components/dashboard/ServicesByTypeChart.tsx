'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import type { ServicesByTypeData } from '@/lib/actions/dashboard'

interface ServicesByTypeChartProps {
  data: ServicesByTypeData[]
}

interface PieTooltipPayload {
  payload: ServicesByTypeData
}

interface CustomTooltipProps {
  active?: boolean
  payload?: PieTooltipPayload[]
}

interface LabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}

interface LegendEntry {
  payload: ServicesByTypeData
}

const COLORS = ['#0066cc', '#37b24d', '#fab005', '#e03131', '#7950f2']

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-medium text-gray-900">{data.label}</p>
        <p className="text-sm text-gray-600">
          {data.cantidad} {data.cantidad === 1 ? 'servicio' : 'servicios'}
        </p>
      </div>
    )
  }
  return null
}

const renderCustomizedLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0
}: LabelProps) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return percent > 0.1 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

export function ServicesByTypeChart({ data }: ServicesByTypeChartProps) {
  const hasData = data.length > 0

  return (
    <Card padding="none" className="h-full">
      <div className="p-6">
        <CardHeader
          title="Servicios por Tipo"
          description="Distribución de los últimos 3 meses"
          className="border-0 pb-0"
        />
      </div>
      <CardContent className="mt-0 h-[300px] px-6 pb-6">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as (ServicesByTypeData & { [key: string]: unknown })[]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="cantidad"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '14px' }}
                formatter={(_value, entry) => (
                  <span className="text-gray-700">{(entry as unknown as LegendEntry).payload.label}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
