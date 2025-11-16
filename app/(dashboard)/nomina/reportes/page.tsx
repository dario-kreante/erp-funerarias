import Link from 'next/link'
import { getCollaborators } from '@/lib/actions/collaborators'
import { getPayrollPeriods } from '@/lib/actions/payroll'
import { formatCurrency } from '@/lib/utils'

export default async function PayrollReportsPage() {
  const [collaborators, periods] = await Promise.all([
    getCollaborators().catch(() => []),
    getPayrollPeriods().catch(() => []),
  ])

  // Calculate statistics
  const totalEmployees = collaborators.filter((c) => c.type === 'empleado').length
  const totalHonorarios = collaborators.filter((c) => c.type === 'honorario').length
  const totalBaseSalary = collaborators
    .filter((c) => c.type === 'empleado' && c.sueldo_base)
    .reduce((sum, c) => sum + (c.sueldo_base || 0), 0)
  const avgBaseSalary = totalEmployees > 0 ? totalBaseSalary / totalEmployees : 0

  const totalPaidOut = periods
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + p.total_neto, 0)
  const totalPending = periods
    .filter((p) => p.estado !== 'pagado')
    .reduce((sum, p) => sum + p.total_neto, 0)

  // Group by cargo
  const cargoGroups: Record<string, { count: number; totalSalary: number }> = {}
  for (const collab of collaborators) {
    const cargo = collab.cargo || 'Sin cargo'
    if (!cargoGroups[cargo]) {
      cargoGroups[cargo] = { count: 0, totalSalary: 0 }
    }
    cargoGroups[cargo].count++
    if (collab.sueldo_base) {
      cargoGroups[cargo].totalSalary += collab.sueldo_base
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/nomina" className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Nómina</h1>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Colaboradores</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{collaborators.length}</div>
          <div className="mt-2 text-xs text-gray-500">
            {totalEmployees} empleados, {totalHonorarios} honorarios
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Promedio Sueldo Base</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{formatCurrency(avgBaseSalary)}</div>
          <div className="mt-2 text-xs text-gray-500">Solo empleados con sueldo base</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Pagado</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(totalPaidOut)}</div>
          <div className="mt-2 text-xs text-gray-500">En períodos cerrados</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Pendiente</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{formatCurrency(totalPending)}</div>
          <div className="mt-2 text-xs text-gray-500">En períodos abiertos</div>
        </div>
      </div>

      {/* Distribution by Cargo */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Distribución por Cargo</h2>
        {Object.keys(cargoGroups).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Sueldo Base
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {Object.entries(cargoGroups)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([cargo, data]) => (
                    <tr key={cargo} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{cargo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-900">
                        {data.count}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(data.totalSalary)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-500">
                        {((data.count / collaborators.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    {collaborators.length}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(totalBaseSalary)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay datos disponibles</p>
        )}
      </div>

      {/* Period History */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Historial de Períodos</h2>
        {periods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Período
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaboradores
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Bruto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Deducciones
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Neto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {periods.slice(0, 12).map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      <Link href={`/nomina/periodos/${period.id}`} className="text-blue-600 hover:text-blue-900">
                        {period.nombre}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-500">
                      {period.cantidad_colaboradores}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(period.total_bruto)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-600">
                      -{formatCurrency(period.total_deducciones)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(period.total_neto)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{period.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay períodos registrados</p>
        )}
      </div>
    </div>
  )
}
