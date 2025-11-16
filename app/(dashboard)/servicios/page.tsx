import Link from 'next/link'
import { getServices } from '@/lib/actions/services'
import { cx } from '@/lib/utils/cx'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/Badge'
import { Plus as PlusIcon } from '@untitledui/icons'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  inhumacion: 'Inhumación',
  cremacion: 'Cremación',
  traslado_nacional: 'Traslado Nacional',
  traslado_internacional: 'Traslado Int.',
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

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    estado: searchParams.estado as string | undefined,
    tipo_servicio: searchParams.tipo_servicio as string | undefined,
    date_from: searchParams.date_from as string | undefined,
    date_to: searchParams.date_to as string | undefined,
    cemetery_id: searchParams.cemetery_id as string | undefined,
    search: searchParams.search as string | undefined,
  }

  const services = await getServices(filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <Link
          href="/servicios/nuevo"
          className={cx(
            'inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
          )}
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Nuevo Servicio
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={filters.search}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Nombre, RUT, número..."
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_ejecucion">En ejecución</option>
              <option value="finalizado">Finalizado</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div>
            <label htmlFor="tipo_servicio" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="tipo_servicio"
              name="tipo_servicio"
              defaultValue={filters.tipo_servicio}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="inhumacion">Inhumación</option>
              <option value="cremacion">Cremación</option>
              <option value="traslado_nacional">Traslado Nacional</option>
              <option value="traslado_internacional">Traslado Internacional</option>
              <option value="solo_velatorio">Solo Velatorio</option>
            </select>
          </div>
          <div>
            <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <input
              type="date"
              name="date_from"
              id="date_from"
              defaultValue={filters.date_from}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fallecido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Responsable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {services && services.length > 0 ? (
              services.map((service: any) => {
                const paidAmount =
                  service.transactions
                    ?.filter((t: any) => t.estado === 'pagado')
                    .reduce((sum: number, t: any) => sum + parseFloat(t.monto || 0), 0) || 0
                const balance = parseFloat(service.total_final || 0) - paidAmount

                return (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {service.numero_servicio || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {service.nombre_fallecido}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {service.nombre_responsable}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {SERVICE_TYPE_LABELS[service.tipo_servicio] || service.tipo_servicio}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(service.fecha_inhumacion_cremacion) || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[service.estado] || 'default'}>
                        {STATUS_LABELS[service.estado] || service.estado}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatCurrency(service.total_final || 0)}</div>
                        {balance > 0 && (
                          <div className="text-xs text-error-600">
                            Saldo: {formatCurrency(balance)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/servicios/${service.id}` as '/dashboard'}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay servicios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
