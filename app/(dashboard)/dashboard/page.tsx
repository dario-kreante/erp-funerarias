import { Suspense } from 'react'
import { getDashboardData } from '@/lib/actions/dashboard'
import {
  KPICards,
  RevenueTrendChart,
  ServicesByTypeChart,
  ActivityFeed,
  AlertsPanel
} from '@/components/dashboard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="h-32">
          <Skeleton className="h-full w-full" />
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card className="h-[400px]">
      <Skeleton className="h-full w-full" />
    </Card>
  )
}

function FeedSkeleton() {
  return (
    <Card className="h-[450px]">
      <Skeleton className="h-full w-full" />
    </Card>
  )
}

async function DashboardContent() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section>
        <KPICards kpis={data.kpis} />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={data.revenueTrend} />
        <ServicesByTypeChart data={data.servicesByType} />
      </section>

      {/* Activity and Alerts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityFeed activities={data.recentActivity} />
        <AlertsPanel alerts={data.alerts} />
      </section>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen de actividad y métricas clave
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <KPICardsSkeleton />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FeedSkeleton />
              <FeedSkeleton />
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
