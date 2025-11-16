import Link from 'next/link'
import { getServices } from '@/lib/actions/services'
import { cx } from '@/lib/utils/cx'
import { AlertTriangle, Plus, Eye } from '@untitledui/icons'
import { Alert } from '@/components/ui/Alert'

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

  const result = await getServices(filters)

  const statusColors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_ejecucion: 'bg-yellow-100 text-yellow-800',
    finalizado: 'bg-green-100 text-green-800',
    cerrado: 'bg-gray-100 text-gray-800',
  }

  const statusLabels: Record<string, string> = {
    borrador: 'Borrador',
    confirmado: 'Confirmado',
    en_ejecucion: 'En ejecución',
    finalizado: 'Finalizado',
    cerrado: 'Cerrado',
  }

  const serviceTypeLabels: Record<string, string> = {
    inhumacion: 'Inhumación',
    cremacion: 'Cremación',
    traslado_nacional: 'Traslado Nacional',
    traslado_internacional: 'Traslado Internacional',
    solo_velatorio: 'Solo Velatorio',
  }

  // Handle error case
  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        </div>
        <Alert variant="error" title="Error al cargar servicios">
          {result.error.message}
        </Alert>
      </div>
    )
  }

  const services = result.data as unknown[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="mt-1 text-sm text-gray-600">
            {services.length} {services.length === 1 ? 'servicio' : 'servicios'} encontrados
          </p>
        </div>
        <Link
          href="/servicios/nuevo"
          className={cx(
            "inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white",
            "shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
            "transition-colors duration-150"
          )}
          aria-label="Crear nuevo servicio"
        >
          <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
          Nuevo Servicio
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Filtros de servicios">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="search"
              name="search"
              id="search"
              defaultValue={filters.search}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Nombre, RUT, número..."
              aria-describedby="search-description"
            />
            <p id="search-description" className="sr-only">
              Buscar por nombre del fallecido, responsable o número de servicio
            </p>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_ejecucion">En ejecución</option>
              <option value="finalizado">Finalizado</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div>
            <label htmlFor="service_type" className="block text-sm font-medium text-gray-700">
              Tipo de servicio
            </label>
            <select
              id="service_type"
              name="service_type"
              defaultValue={filters.service_type}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              aria-label="Filtrar por tipo de servicio"
            >
              <option value="">Todos los tipos</option>
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
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-150"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Lista de servicios">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Número
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fallecido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Responsable
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Acciones</span>
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
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                        {serviceTypeLabels[service.service_type] || service.service_type}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <time dateTime={service.burial_cremation_date}>
                          {service.burial_cremation_date
                            ? new Date(service.burial_cremation_date).toLocaleDateString('es-CL')
                            : '-'}
                        </time>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cx(
                            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                            statusColors[service.status] || statusColors.borrador
                          )}
                          role="status"
                        >
                          {statusLabels[service.status] || service.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            ${parseFloat(service.total_final || 0).toLocaleString('es-CL')}
                          </div>
                          {balance > 0 && (
                            <div className="text-xs text-red-600" role="alert">
                              Saldo: ${balance.toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/servicios/${service.id}`}
                          className="inline-flex items-center text-primary-600 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                          aria-label={`Ver detalles del servicio ${service.service_number}`}
                        >
                          <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" aria-hidden="true" />
                      <p className="text-sm text-gray-500">
                        No hay servicios registrados
                      </p>
                      <Link
                        href="/servicios/nuevo"
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Crear primer servicio
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
