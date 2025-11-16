'use client'

import { Card } from '@/components/ui/Card'
import { formatCurrencyCompact } from '@/lib/utils'
import { cx } from '@/lib/utils/cx'
import {
  Briefcase01,
  CheckCircleBroken,
  CurrencyDollarCircle,
  Receipt,
  Clock,
  TrendUp01,
  TrendDown01
} from '@untitledui/icons'
import type { DashboardKPIs } from '@/lib/actions/dashboard'

interface KPICardsProps {
  kpis: DashboardKPIs
}

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'info'
}

function KPICard({ title, value, icon, trend, trendLabel, variant = 'default' }: KPICardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  const variantStyles = {
    default: 'bg-gray-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    info: 'bg-blue-50'
  }

  const iconStyles = {
    default: 'text-gray-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    info: 'text-blue-600'
  }

  return (
    <Card className="relative overflow-hidden" padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? formatCurrencyCompact(value) : value}
          </p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive && <TrendUp01 className="h-4 w-4 text-success-500" />}
              {isNegative && <TrendDown01 className="h-4 w-4 text-error-500" />}
              <span
                className={cx(
                  'text-sm font-medium',
                  isPositive && 'text-success-600',
                  isNegative && 'text-error-600',
                  !isPositive && !isNegative && 'text-gray-600'
                )}
              >
                {isPositive && '+'}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cx(
            'rounded-lg p-3',
            variantStyles[variant]
          )}
        >
          <div className={cx('h-6 w-6', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KPICard
        title="Servicios Activos"
        value={kpis.serviciosActivos.toString()}
        icon={<Briefcase01 className="h-6 w-6" />}
        variant="info"
      />
      <KPICard
        title="Servicios Completados"
        value={kpis.serviciosCompletados.toString()}
        icon={<CheckCircleBroken className="h-6 w-6" />}
        trend={kpis.serviciosVsMesAnterior}
        trendLabel="vs mes anterior"
        variant="success"
      />
      <KPICard
        title="Ingresos del Mes"
        value={kpis.ingresosMes}
        icon={<CurrencyDollarCircle className="h-6 w-6" />}
        trend={kpis.ingresosVsMesAnterior}
        trendLabel="vs mes anterior"
        variant="success"
      />
      <KPICard
        title="Egresos del Mes"
        value={kpis.egresosMes}
        icon={<Receipt className="h-6 w-6" />}
        variant="warning"
      />
      <KPICard
        title="Cobros Pendientes"
        value={kpis.cobrosPendientes}
        icon={<Clock className="h-6 w-6" />}
        variant="warning"
      />
    </div>
  )
}
