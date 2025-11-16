import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCollaborator, getCollaboratorPayrollHistory } from '@/lib/actions/collaborators'
import { getCollaboratorAssignments, getAssignmentStats } from '@/lib/actions/service-assignments'
import { cx } from '@/lib/utils/cx'
import { formatRut, formatCurrency, formatDate } from '@/lib/utils'

export default async function CollaboratorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [collaborator, assignments, payrollHistory, stats] = await Promise.all([
    getCollaborator(params.id).catch(() => null),
    getCollaboratorAssignments(params.id).catch(() => []),
    getCollaboratorPayrollHistory(params.id).catch(() => []),
    getAssignmentStats(params.id).catch(() => ({
      total_servicios: 0,
      total_extras: 0,
      roles: {},
      tipos_extra: {},
    })),
  ])

  if (!collaborator) {
    notFound()
  }

  const typeLabels: Record<string, string> = {
    empleado: 'Empleado',
    honorario: 'Honorario',
  }

  const typeColors: Record<string, string> = {
    empleado: 'bg-blue-100 text-blue-800',
    honorario: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/nomina/colaboradores" className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{collaborator.nombre_completo}</h1>
          <span
            className={cx(
              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
              typeColors[collaborator.type] || typeColors.empleado
            )}
          >
            {typeLabels[collaborator.type] || collaborator.type}
          </span>
          <span
            className={cx(
              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
              collaborator.estado_activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}
          >
            {collaborator.estado_activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <Link
          href={`/nomina/colaboradores/${collaborator.id}/editar`}
          className={cx(
            'inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-blue-500'
          )}
        >
          Editar
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Servicios</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_servicios}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Extras</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(stats.total_extras)}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Sueldo Base</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {collaborator.sueldo_base ? formatCurrency(collaborator.sueldo_base) : 'N/A'}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Periodos Pagados</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{payrollHistory.length}</div>
        </div>
      </div>

      {/* Info and Assignments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Collaborator Info */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Información del Colaborador</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">RUT</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatRut(collaborator.rut)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cargo</dt>
              <dd className="mt-1 text-sm text-gray-900">{collaborator.cargo || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">{collaborator.telefono || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{collaborator.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
              <dd className="mt-1 text-sm text-gray-900">{collaborator.metodo_pago || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sucursal</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(collaborator as any).branch?.nombre || 'Sin asignar'}
              </dd>
            </div>
            {collaborator.notas && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notas</dt>
                <dd className="mt-1 text-sm text-gray-900">{collaborator.notas}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Role Distribution */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Distribución de Roles</h2>
          {Object.keys(stats.roles).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.roles)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{role.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sin servicios asignados</p>
          )}
        </div>
      </div>

      {/* Recent Service Assignments */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Asignaciones de Servicios Recientes</h2>
        {assignments && assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Servicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fallecido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo Extra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Monto Extra
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignments.slice(0, 10).map((assignment: any) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600">
                      <Link href={`/servicios/${assignment.service.id}`}>
                        {assignment.service.numero_servicio}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {assignment.service.nombre_fallecido}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {assignment.rol_en_servicio.replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {assignment.tipo_extra.replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(assignment.monto_extra)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(assignment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin asignaciones de servicios</p>
        )}
      </div>

      {/* Payroll History */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Historial de Nómina</h2>
        {payrollHistory && payrollHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Período
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
                    Descuentos
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
                {payrollHistory.map((record: any) => (
                  <tr key={record.periodo_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {record.periodo_nombre}
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
                      {formatCurrency(record.bonos)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin registros de nómina</p>
        )}
      </div>
    </div>
  )
}
