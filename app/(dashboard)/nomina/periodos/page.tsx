import Link from 'next/link'
import { getPayrollPeriods } from '@/lib/actions/payroll'
import { cx } from '@/lib/utils/cx'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function PayrollPeriodsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    estado: searchParams.estado as 'abierto' | 'cerrado' | 'procesado' | 'pagado' | undefined,
    search: searchParams.search as string | undefined,
  }

  const periods = await getPayrollPeriods(filters)

  const statusLabels: Record<string, string> = {
    abierto: 'Abierto',
    cerrado: 'Cerrado',
    procesado: 'Procesado',
    pagado: 'Pagado',
  }

  const statusColors: Record<string, string> = {
    abierto: 'bg-blue-100 text-blue-800',
    cerrado: 'bg-yellow-100 text-yellow-800',
    procesado: 'bg-purple-100 text-purple-800',
    pagado: 'bg-green-100 text-green-800',
  }

  const totalBruto = periods?.reduce((sum, p) => sum + (p.total_bruto || 0), 0) || 0
  const totalNeto = periods?.reduce((sum, p) => sum + (p.total_neto || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Períodos de Nómina</h1>
        <Link
          href="/nomina/periodos/nuevo"
          className={cx(
            'inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
          )}
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Período
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={filters.search}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Nombre del período..."
            />
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={filters.estado}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
              <option value="procesado">Procesado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Períodos</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{periods?.length || 0}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Períodos Abiertos</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {periods?.filter((p) => p.estado === 'abierto').length || 0}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Bruto</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalBruto)}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Neto</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(totalNeto)}</div>
        </div>
      </div>

      {/* Periods Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha Fin
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Colaboradores
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Bruto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Neto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {periods && periods.length > 0 ? (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {period.nombre}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(period.fecha_inicio)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(period.fecha_fin)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900">
                    {period.cantidad_colaboradores}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(period.total_bruto)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(period.total_neto)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        statusColors[period.estado] || statusColors.abierto
                      )}
                    >
                      {statusLabels[period.estado] || period.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/nomina/periodos/${period.id}`} className="text-blue-600 hover:text-blue-900">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay períodos de nómina registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
