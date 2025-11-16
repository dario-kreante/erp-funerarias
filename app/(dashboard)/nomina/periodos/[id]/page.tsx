import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayrollPeriod } from '@/lib/actions/payroll'
import { cx } from '@/lib/utils/cx'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayrollPeriodActions } from './PayrollPeriodActions'

export default async function PayrollPeriodDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const period = await getPayrollPeriod(params.id).catch(() => null)

  if (!period) {
    notFound()
  }

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

  const typeColors: Record<string, string> = {
    empleado: 'bg-blue-100 text-blue-800',
    honorario: 'bg-purple-100 text-purple-800',
  }

  const records = (period as any).payroll_records || []
  const approvedCount = records.filter((r: any) => r.aprobado).length
  const pendingCount = records.filter((r: any) => !r.aprobado).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/nomina/periodos" className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{period.nombre}</h1>
          <span
            className={cx(
              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
              statusColors[period.estado] || statusColors.abierto
            )}
          >
            {statusLabels[period.estado] || period.estado}
          </span>
        </div>
        <PayrollPeriodActions periodId={period.id} periodStatus={period.estado} />
      </div>

      {/* Period Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Fecha Inicio</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{formatDate(period.fecha_inicio)}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Fecha Fin</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{formatDate(period.fecha_fin)}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Colaboradores</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{period.cantidad_colaboradores}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Aprobados / Pendientes</div>
          <div className="mt-1 text-lg font-semibold">
            <span className="text-green-600">{approvedCount}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-yellow-600">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Bruto</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(period.total_bruto)}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Deducciones</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            -{formatCurrency(period.total_deducciones)}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Neto a Pagar</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(period.total_neto)}</div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Registros de Nómina</h2>
          {records.length === 0 && (
            <p className="text-sm text-gray-500">
              Haga clic en &quot;Calcular Nómina&quot; para generar los registros
            </p>
          )}
        </div>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sueldo Base
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Servicios
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Extras
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bonos
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recibo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      <Link
                        href={`/nomina/colaboradores/${record.collaborator.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {record.collaborator.nombre_completo}
                      </Link>
                      <div className="text-xs text-gray-500">{record.collaborator.cargo || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          typeColors[record.collaborator.type] || typeColors.empleado
                        )}
                      >
                        {record.collaborator.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(record.sueldo_base)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-500">
                      {record.cantidad_servicios}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(record.total_extras)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(record.bonos + record.comisiones)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(record.total_bruto)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-600">
                      -{formatCurrency(record.total_deducciones)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(record.total_neto)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          record.aprobado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {record.aprobado ? 'Aprobado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {record.payment_receipts && record.payment_receipts.length > 0 ? (
                        <Link
                          href={`/nomina/recibos/${record.payment_receipts[0].id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {record.payment_receipts[0].numero_recibo}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
                    TOTALES
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(records.reduce((sum: number, r: any) => sum + r.sueldo_base, 0))}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    {records.reduce((sum: number, r: any) => sum + r.cantidad_servicios, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(records.reduce((sum: number, r: any) => sum + r.total_extras, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(records.reduce((sum: number, r: any) => sum + r.bonos + r.comisiones, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(period.total_bruto)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                    -{formatCurrency(period.total_deducciones)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(period.total_neto)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin registros</h3>
            <p className="mt-1 text-sm text-gray-500">
              Utilice el botón &quot;Calcular Nómina&quot; para generar los registros de pago
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {period.notas && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Notas</h2>
          <p className="text-sm text-gray-700">{period.notas}</p>
        </div>
      )}
    </div>
  )
}
