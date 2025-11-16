import Link from 'next/link'
import { getCollaborators } from '@/lib/actions/collaborators'
import { getPayrollPeriods } from '@/lib/actions/payroll'
import { formatCurrency } from '@/lib/utils'

export default async function PayrollPage() {
  const [collaborators, periods] = await Promise.all([
    getCollaborators().catch(() => []),
    getPayrollPeriods().catch(() => []),
  ])

  const activeCollaborators = collaborators.filter((c) => c.estado_activo).length
  const openPeriods = periods.filter((p) => p.estado === 'abierto').length
  const totalPending = periods
    .filter((p) => p.estado === 'abierto')
    .reduce((sum, p) => sum + (p.total_neto || 0), 0)

  const modules = [
    {
      title: 'Colaboradores',
      description: 'Gestiona empleados y trabajadores a honorarios',
      href: '/nomina/colaboradores',
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      stats: `${activeCollaborators} activos`,
    },
    {
      title: 'Períodos de Nómina',
      description: 'Crea y administra períodos de pago mensuales',
      href: '/nomina/periodos',
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      stats: `${openPeriods} abiertos`,
    },
    {
      title: 'Recibos de Pago',
      description: 'Genera y gestiona recibos de pago',
      href: '/nomina/recibos',
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      stats: 'Ver todos',
    },
    {
      title: 'Reportes',
      description: 'Informes y estadísticas de nómina',
      href: '/nomina/reportes',
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      stats: 'Ver reportes',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Módulo de Nómina</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Colaboradores</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{collaborators.length}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Empleados</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {collaborators.filter((c) => c.type === 'empleado').length}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Honorarios</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">
            {collaborators.filter((c) => c.type === 'honorario').length}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Pendiente de Pago</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{formatCurrency(totalPending)}</div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">{module.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                <p className="mt-2 text-sm font-medium text-blue-600">{module.stats}</p>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/nomina/colaboradores/nuevo"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Colaborador
          </Link>
          <Link
            href="/nomina/periodos/nuevo"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Período
          </Link>
        </div>
      </div>
    </div>
  )
}

