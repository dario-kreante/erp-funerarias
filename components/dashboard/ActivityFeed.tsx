'use client'

import { ComponentType } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { cx } from '@/lib/utils/cx'
import {
  Plus,
  Edit03,
  Trash01,
  User01
} from '@untitledui/icons'
import type { ActivityItem } from '@/lib/actions/dashboard'

interface ActivityFeedProps {
  activities: ActivityItem[]
}

interface ActionConfig {
  icon: ComponentType<{ className?: string }>
  color: string
  badgeVariant: 'success' | 'info' | 'error'
}

const actionConfig: Record<string, ActionConfig> = {
  CREATE: {
    icon: Plus,
    color: 'text-success-500',
    badgeVariant: 'success'
  },
  UPDATE: {
    icon: Edit03,
    color: 'text-blue-500',
    badgeVariant: 'info'
  },
  DELETE: {
    icon: Trash01,
    color: 'text-error-500',
    badgeVariant: 'error'
  }
}

function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  const config = actionConfig[activity.tipo] || actionConfig.UPDATE
  const Icon = config.icon

  return (
    <div className="flex gap-3 py-3">
      <div className="flex-shrink-0">
        <div
          className={cx(
            'flex h-8 w-8 items-center justify-center rounded-full bg-gray-100',
            config.color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">
            {activity.descripcion}
          </p>
          <Badge variant={config.badgeVariant} size="sm">
            {activity.tipo}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {activity.usuario && (
            <>
              <User01 className="h-3 w-3" />
              <span>{activity.usuario}</span>
              <span>·</span>
            </>
          )}
          <span>{formatRelativeTime(new Date(activity.fecha), true)}</span>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const hasActivities = activities.length > 0

  return (
    <Card padding="none" className="h-full">
      <div className="p-6">
        <CardHeader
          title="Actividad Reciente"
          description="Últimas acciones realizadas"
          className="border-0 pb-0"
        />
      </div>
      <CardContent className="mt-0 max-h-[400px] overflow-y-auto px-6 pb-6">
        {hasActivities ? (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-500">No hay actividad reciente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
