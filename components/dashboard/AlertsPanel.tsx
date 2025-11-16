'use client'

import { ComponentType } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { cx } from '@/lib/utils/cx'
import {
  AlertCircle,
  Clock,
  FileQuestion02,
  CheckCircle,
  ChevronRight
} from '@untitledui/icons'
import type { AlertItem } from '@/lib/actions/dashboard'

interface AlertsPanelProps {
  alerts: AlertItem[]
}

interface AlertTypeConfigItem {
  icon: ComponentType<{ className?: string }>
  color: string
  bg: string
}

const alertTypeConfig: Record<AlertItem['tipo'], AlertTypeConfigItem> = {
  documento_pendiente: {
    icon: FileQuestion02,
    color: 'text-warning-600',
    bg: 'bg-warning-50'
  },
  pago_vencido: {
    icon: AlertCircle,
    color: 'text-error-600',
    bg: 'bg-error-50'
  },
  cuota_pendiente: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  servicio_sin_finalizar: {
    icon: CheckCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-50'
  }
}

const priorityConfig: Record<
  AlertItem['prioridad'],
  { variant: 'error' | 'warning' | 'info'; label: string }
> = {
  alta: { variant: 'error', label: 'Alta' },
  media: { variant: 'warning', label: 'Media' },
  baja: { variant: 'info', label: 'Baja' }
}

function AlertItemComponent({ alert }: { alert: AlertItem }) {
  const typeConfig = alertTypeConfig[alert.tipo]
  const prioConfig = priorityConfig[alert.prioridad]
  const Icon = typeConfig.icon

  const content = (
    <div
      className={cx(
        'flex items-start gap-3 rounded-lg p-3 transition-colors',
        alert.enlace && 'hover:bg-gray-50'
      )}
    >
      <div
        className={cx(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          typeConfig.bg
        )}
      >
        <Icon className={cx('h-4 w-4', typeConfig.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900">{alert.titulo}</h4>
          <Badge variant={prioConfig.variant} size="sm">
            {prioConfig.label}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-600">{alert.descripcion}</p>
        <p className="mt-1 text-xs text-gray-400">
          {formatRelativeTime(new Date(alert.fecha), true)}
        </p>
      </div>
      {alert.enlace && (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
      )}
    </div>
  )

  if (alert.enlace) {
    return (
      <Link href={alert.enlace} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const hasAlerts = alerts.length > 0
  const highPriorityCount = alerts.filter((a) => a.prioridad === 'alta').length

  return (
    <Card padding="none" className="h-full">
      <div className="p-6">
        <CardHeader className="border-0 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
                {highPriorityCount > 0 && (
                  <Badge variant="error" size="sm">
                    {highPriorityCount} urgente{highPriorityCount !== 1 && 's'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Elementos que requieren atención
              </p>
            </div>
          </div>
        </CardHeader>
      </div>
      <CardContent className="mt-0 max-h-[400px] overflow-y-auto px-6 pb-6">
        {hasAlerts ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertItemComponent key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-success-500" />
              <p className="mt-2 text-sm text-gray-500">
                No hay alertas pendientes
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
