import { Skeleton } from '@/components/ui/Skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={i === 0 ? '20%' : '15%'} height={16} />
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  width={colIndex === 0 ? '20%' : '15%'}
                  height={14}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ServiceTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width={200} height={28} className="mb-2" />
          <Skeleton width={300} height={16} />
        </div>
        <Skeleton width={140} height={40} variant="rectangular" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <Skeleton width={200} height={40} variant="rectangular" />
        <Skeleton width={160} height={40} variant="rectangular" />
        <Skeleton width={160} height={40} variant="rectangular" />
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={8} columns={7} />

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={14} />
        <div className="flex gap-2">
          <Skeleton width={80} height={36} variant="rectangular" />
          <Skeleton width={80} height={36} variant="rectangular" />
        </div>
      </div>
    </div>
  )
}

export function TransactionTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width={180} height={28} className="mb-2" />
          <Skeleton width={250} height={16} />
        </div>
        <Skeleton width={160} height={40} variant="rectangular" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <Skeleton width={120} height={14} className="mb-2" />
            <Skeleton width={100} height={24} />
          </div>
        ))}
      </div>

      {/* Table */}
      <TableSkeleton rows={6} columns={5} />
    </div>
  )
}

export function ExpenseTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width={120} height={28} className="mb-2" />
          <Skeleton width={220} height={16} />
        </div>
        <Skeleton width={140} height={40} variant="rectangular" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton width={180} height={40} variant="rectangular" />
        <Skeleton width={140} height={40} variant="rectangular" />
      </div>

      {/* Table */}
      <TableSkeleton rows={6} columns={6} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <Skeleton width={250} height={32} className="mb-2" />
        <Skeleton width={180} height={16} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <Skeleton width={100} height={14} className="mb-3" />
            <Skeleton width={80} height={28} className="mb-1" />
            <Skeleton width={60} height={12} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton width="100%" height={200} variant="rectangular" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton width="100%" height={200} variant="rectangular" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton width={180} height={20} className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton width={40} height={40} variant="circular" />
              <div className="flex-1">
                <Skeleton width="70%" height={14} className="mb-1" />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
