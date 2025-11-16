import { getService } from '@/lib/actions/services'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cx } from '@/lib/utils/cx'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatRut } from '@/lib/utils/rut'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft as ArrowLeftIcon, Edit03 as EditIcon } from '@untitledui/icons'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  inhumacion: 'Inhumación',
  cremacion: 'Cremación',
  traslado_nacional: 'Traslado Nacional',
  traslado_internacional: 'Traslado Internacional',
  solo_velatorio: 'Solo Velatorio',
}

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  confirmado: 'Confirmado',
  en_ejecucion: 'En Ejecución',
  finalizado: 'Finalizado',
  cerrado: 'Cerrado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  borrador: 'default',
  confirmado: 'primary',
  en_ejecucion: 'warning',
  finalizado: 'success',
  cerrado: 'default',
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  let service
  try {
    service = await getService(params.id)
  } catch {
    notFound()
  }

  if (!service) {
    notFound()
  }

  const paidAmount =
    service.transactions
      ?.filter((t: any) => t.estado === 'pagado')
      .reduce((sum: number, t: any) => sum + parseFloat(t.monto || 0), 0) || 0
  const balance = parseFloat(service.total_final || 0) - paidAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/servicios"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Volver a servicios
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Servicio {service.numero_servicio || '#' + service.id.slice(0, 8)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge size="md" variant={STATUS_VARIANTS[service.estado] || 'default'}>
            {STATUS_LABELS[service.estado] || service.estado}
          </Badge>
          <Link href={`/servicios/${service.id}/editar` as '/dashboard'}>
            <Button variant="secondary" size="sm">
              <EditIcon className="mr-1 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Información General */}
          <Card>
            <CardHeader title="Información General" />
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de Servicio</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {SERVICE_TYPE_LABELS[service.tipo_servicio] || service.tipo_servicio}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {service.plan ? service.plan.nombre : 'Sin plan asignado'}
                  </dd>
                </div>
                {service.coffin && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ataúd</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.coffin.nombre_comercial}</dd>
                  </div>
                )}
                {service.urn && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Urna</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.urn.nombre_comercial}</dd>
                  </div>
                )}
                {service.notas_generales && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notas Generales</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.notas_generales}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Datos del Fallecido */}
          <Card>
            <CardHeader title="Datos del Fallecido" />
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.nombre_fallecido}</dd>
                </div>
                {service.rut_fallecido && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">RUT</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatRut(service.rut_fallecido)}</dd>
                  </div>
                )}
                {service.fecha_nacimiento_fallecido && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(service.fecha_nacimiento_fallecido)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Fallecimiento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(service.fecha_fallecimiento)}
                  </dd>
                </div>
                {service.tipo_lugar_fallecimiento && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo de Lugar</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {service.tipo_lugar_fallecimiento.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {service.lugar_fallecimiento && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Lugar de Fallecimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.lugar_fallecimiento}</dd>
                  </div>
                )}
                {service.causa_fallecimiento && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Causa de Fallecimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.causa_fallecimiento}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Responsable Económico */}
          <Card>
            <CardHeader title="Responsable Económico" />
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.nombre_responsable}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">RUT</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatRut(service.rut_responsable)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.telefono_responsable}</dd>
                </div>
                {service.email_responsable && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.email_responsable}</dd>
                  </div>
                )}
                {service.parentesco_responsable && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Parentesco</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.parentesco_responsable}</dd>
                  </div>
                )}
                {service.direccion_responsable && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.direccion_responsable}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Agenda y Logística */}
          {(service.fecha_inicio_velatorio ||
            service.fecha_inhumacion_cremacion ||
            service.sala_velatorio) && (
            <Card>
              <CardHeader title="Agenda y Logística" />
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {service.fecha_recogida && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Retiro del Cuerpo</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(service.fecha_recogida)}
                      </dd>
                    </div>
                  )}
                  {service.fecha_inicio_velatorio && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Inicio Velatorio</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(service.fecha_inicio_velatorio)}
                      </dd>
                    </div>
                  )}
                  {service.sala_velatorio && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sala de Velación</dt>
                      <dd className="mt-1 text-sm text-gray-900">{service.sala_velatorio}</dd>
                    </div>
                  )}
                  {service.fecha_ceremonia_religiosa && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ceremonia Religiosa</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(service.fecha_ceremonia_religiosa)}
                      </dd>
                    </div>
                  )}
                  {service.fecha_inhumacion_cremacion && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Inhumación/Cremación</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(service.fecha_inhumacion_cremacion)}
                      </dd>
                    </div>
                  )}
                  {service.cemetery && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cementerio/Crematorio</dt>
                      <dd className="mt-1 text-sm text-gray-900">{service.cemetery.nombre}</dd>
                    </div>
                  )}
                  {service.main_vehicle && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Vehículo Principal</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {service.main_vehicle.placa} - {service.main_vehicle.tipo_vehiculo}
                      </dd>
                    </div>
                  )}
                  {service.notas_logistica && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Notas de Logística</dt>
                      <dd className="mt-1 text-sm text-gray-900">{service.notas_logistica}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Colaboradores */}
          {service.service_assignments && service.service_assignments.length > 0 && (
            <Card>
              <CardHeader title="Colaboradores Asignados" />
              <CardContent>
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
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Extra
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {service.service_assignments.map((assignment: any) => (
                        <tr key={assignment.id}>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                            {assignment.collaborator?.nombre_completo}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                            {assignment.rol_en_servicio}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900">
                            {formatCurrency(assignment.monto_extra || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Procedimientos */}
          {service.service_procedures && service.service_procedures.length > 0 && (
            <Card>
              <CardHeader title="Procedimientos" />
              <CardContent>
                <div className="space-y-3">
                  {service.service_procedures.map((proc: any) => (
                    <div
                      key={proc.id}
                      className={cx(
                        'flex items-center justify-between rounded-lg border p-3',
                        proc.completado ? 'border-success-200 bg-success-50' : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={proc.completado}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                        <span className={cx('text-sm', proc.completado && 'line-through')}>
                          {proc.nombre_procedimiento}
                        </span>
                      </div>
                      {proc.fecha_completado && (
                        <span className="text-xs text-gray-500">
                          {formatDateTime(proc.fecha_completado)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <Card>
            <CardHeader title="Resumen Financiero" />
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Total Items</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(service.total_items || 0)}
                  </dd>
                </div>
                {(service.monto_descuento > 0 || service.porcentaje_descuento > 0) && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Descuento</dt>
                    <dd className="text-sm font-medium text-error-600">
                      -{formatCurrency(service.monto_descuento || 0)}
                      {service.porcentaje_descuento > 0 && ` (${service.porcentaje_descuento}%)`}
                    </dd>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <dt className="text-base font-semibold text-gray-900">Total Final</dt>
                    <dd className="text-base font-bold text-gray-900">
                      {formatCurrency(service.total_final || 0)}
                    </dd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Pagado</dt>
                  <dd className="text-sm font-medium text-success-600">
                    {formatCurrency(paidAmount)}
                  </dd>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <dt className="text-base font-semibold text-gray-900">Saldo Pendiente</dt>
                    <dd
                      className={cx(
                        'text-base font-bold',
                        balance > 0 ? 'text-error-600' : 'text-success-600'
                      )}
                    >
                      {formatCurrency(balance)}
                    </dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Transacciones */}
          {service.transactions && service.transactions.length > 0 && (
            <Card>
              <CardHeader title="Transacciones" />
              <CardContent>
                <div className="space-y-3">
                  {service.transactions.map((transaction: any) => (
                    <div key={transaction.id} className="border-b border-gray-200 pb-3 last:border-0">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-900">
                          {formatDate(transaction.fecha_transaccion)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(transaction.monto)}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span className="capitalize">{transaction.metodo_pago?.replace('_', ' ')}</span>
                        <Badge
                          size="sm"
                          variant={transaction.estado === 'pagado' ? 'success' : 'warning'}
                        >
                          {transaction.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentos */}
          {service.documents && service.documents.length > 0 && (
            <Card>
              <CardHeader title="Documentos" />
              <CardContent>
                <div className="space-y-2">
                  {service.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded border border-gray-200 p-2"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{doc.nombre_archivo}</div>
                        <div className="text-xs text-gray-500">{doc.tipo_documento}</div>
                      </div>
                      <a
                        href={doc.url_archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        Ver
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
