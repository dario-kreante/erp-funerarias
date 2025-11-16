'use client'

import { formatCurrency } from '@/lib/utils/currency'

interface QuotaStatsProps {
  stats: {
    total: number
    en_preparacion: number
    ingresadas: number
    aprobadas: number
    rechazadas: number
    pagadas: number
    monto_total_aprobado: number
    monto_total_pagado: number
  }
}

export function QuotaStats({ stats }: QuotaStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-yellow-700">En Preparación</p>
        <p className="mt-1 text-2xl font-semibold text-yellow-800">{stats.en_preparacion}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Ingresadas</p>
        <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.ingresadas}</p>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-green-700">Aprobadas</p>
        <p className="mt-1 text-2xl font-semibold text-green-800">{stats.aprobadas}</p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-red-700">Rechazadas</p>
        <p className="mt-1 text-2xl font-semibold text-red-800">{stats.rechazadas}</p>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-purple-700">Pagadas</p>
        <p className="mt-1 text-2xl font-semibold text-purple-800">{stats.pagadas}</p>
      </div>

      <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-4 sm:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Monto Total Aprobado</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {formatCurrency(stats.monto_total_aprobado)}
        </p>
      </div>

      <div className="col-span-2 rounded-lg border border-success-200 bg-success-50 p-4 sm:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-success-700">Monto Total Pagado</p>
        <p className="mt-1 text-2xl font-semibold text-success-800">
          {formatCurrency(stats.monto_total_pagado)}
        </p>
      </div>
    </div>
  )
}
