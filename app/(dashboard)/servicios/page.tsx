import Link from 'next/link'
import { getServices } from '@/lib/actions/services'
import { cx } from '@/lib/utils/cx'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    status: searchParams.status as string | undefined,
    service_type: searchParams.service_type as string | undefined,
    date_from: searchParams.date_from as string | undefined,
    date_to: searchParams.date_to as string | undefined,
    cemetery_id: searchParams.cemetery_id as string | undefined,
    search: searchParams.search as string | undefined,
  }

  const services = await getServices(filters)

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
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <Link
          href="/servicios/nuevo"
          className={cx(
            "inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white",
            "shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          )}
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Servicio
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              placeholder="Nombre, RUT, número..."
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            <label htmlFor="service_type" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="service_type"
              name="service_type"
              defaultValue={filters.service_type}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="inhumacion">Inhumación</option>
              <option value="cremacion">Cremación</option>
              <option value="traslado_nacional">Traslado Nacional</option>
              <option value="traslado_internacional">Traslado Internacional</option>
              <option value="solo_velatorio">Solo Velatorio</option>
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
                const paidAmount = service.transactions
                  ?.filter((t: any) => t.status === 'pagado')
                  .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0
                const balance = parseFloat(service.total_final || 0) - paidAmount

                return (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {service.service_number}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {service.deceased_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {service.responsible_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {service.service_type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {service.burial_cremation_date
                        ? new Date(service.burial_cremation_date).toLocaleDateString('es-CL')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          statusColors[service.status] || statusColors.borrador
                        )}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          ${parseFloat(service.total_final || 0).toLocaleString('es-CL')}
                        </div>
                        {balance > 0 && (
                          <div className="text-xs text-red-600">Saldo: ${balance.toLocaleString('es-CL')}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/servicios/${service.id}`}
                        className="text-blue-600 hover:text-blue-900"
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

