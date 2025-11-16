import { getService } from '@/lib/actions/services'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cx } from '@/lib/utils/cx'

export default async function ServiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  let serviceResult
  try {
    serviceResult = await getService(params.id)
  } catch (error) {
    notFound()
  }

  if (!serviceResult || !serviceResult.success) {
    notFound()
  }

  const service = serviceResult.data as any

  const paidAmount = service.transactions
    ?.filter((t: any) => t.status === 'pagado')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
  const balance = parseFloat(service.total_final || 0) - paidAmount

  const statusColors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_ejecucion: 'bg-yellow-100 text-yellow-800',
    finalizado: 'bg-green-100 text-green-800',
    cerrado: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/servicios"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver a servicios
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Servicio {service.service_number}
          </h1>
        </div>
        <span
          className={cx(
            'inline-flex rounded-full px-3 py-1 text-sm font-semibold',
            statusColors[service.status] || statusColors.borrador
          )}
        >
          {service.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo de Servicio</dt>
                <dd className="mt-1 text-sm text-gray-900">{service.service_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {service.plan ? service.plan.name : 'Sin plan asignado'}
                </dd>
              </div>
              {service.general_notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Observaciones</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.general_notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Datos del Fallecido */}
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Fallecido</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{service.deceased_name}</dd>
              </div>
              {service.deceased_rut && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">RUT</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.deceased_rut}</dd>
                </div>
              )}
              {service.deceased_birth_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(service.deceased_birth_date).toLocaleDateString('es-CL')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Fallecimiento</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(service.deceased_death_date).toLocaleDateString('es-CL')}
                </dd>
              </div>
              {service.deceased_death_place && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Lugar de Fallecimiento</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.deceased_death_place}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Responsable Económico */}
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsable Económico</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{service.responsible_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">RUT</dt>
                <dd className="mt-1 text-sm text-gray-900">{service.responsible_rut}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900">{service.responsible_phone}</dd>
              </div>
              {service.responsible_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.responsible_email}</dd>
                </div>
              )}
              {service.responsible_relationship && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Relación</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.responsible_relationship}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Agenda y Logística */}
          {(service.wake_start_date || service.burial_cremation_date || service.wake_room) && (
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Agenda y Logística</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {service.pickup_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Retiro del Cuerpo</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(service.pickup_date).toLocaleString('es-CL')}
                    </dd>
                  </div>
                )}
                {service.wake_start_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Inicio Velatorio</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(service.wake_start_date).toLocaleString('es-CL')}
                    </dd>
                  </div>
                )}
                {service.wake_room && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sala de Velación</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.wake_room}</dd>
                  </div>
                )}
                {service.burial_cremation_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Inhumación/Cremación</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(service.burial_cremation_date).toLocaleString('es-CL')}
                    </dd>
                  </div>
                )}
                {service.cemetery && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cementerio/Crematorio</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.cemetery.name}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Colaboradores */}
          {service.service_assignments && service.service_assignments.length > 0 && (
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Colaboradores Asignados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Colaborador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Extra
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {service.service_assignments.map((assignment: any) => (
                      <tr key={assignment.id}>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                          {assignment.collaborator?.full_name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          {assignment.role_in_service}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                          ${parseFloat(assignment.extra_amount || 0).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Items</dt>
                <dd className="text-sm font-medium text-gray-900">
                  ${parseFloat(service.total_items || 0).toLocaleString('es-CL')}
                </dd>
              </div>
              {(service.discount_amount > 0 || service.discount_percentage > 0) && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Descuento</dt>
                  <dd className="text-sm font-medium text-red-600">
                    -${parseFloat(service.discount_amount || 0).toLocaleString('es-CL')}
                    {service.discount_percentage > 0 && ` (${service.discount_percentage}%)`}
                  </dd>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <dt className="text-base font-semibold text-gray-900">Total Final</dt>
                  <dd className="text-base font-bold text-gray-900">
                    ${parseFloat(service.total_final || 0).toLocaleString('es-CL')}
                  </dd>
                </div>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Pagado</dt>
                <dd className="text-sm font-medium text-green-600">
                  ${paidAmount.toLocaleString('es-CL')}
                </dd>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <dt className="text-base font-semibold text-gray-900">Saldo Pendiente</dt>
                  <dd className={cx(
                    "text-base font-bold",
                    balance > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    ${balance.toLocaleString('es-CL')}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Transacciones */}
          {service.transactions && service.transactions.length > 0 && (
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transacciones</h2>
              <div className="space-y-3">
                {service.transactions.map((transaction: any) => (
                  <div key={transaction.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">
                        {new Date(transaction.transaction_date).toLocaleDateString('es-CL')}
                      </span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(transaction.amount).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>{transaction.payment_method}</span>
                      <span className={cx(
                        transaction.status === 'pagado' ? 'text-green-600' : 'text-yellow-600'
                      )}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

