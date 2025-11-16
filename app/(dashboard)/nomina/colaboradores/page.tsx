import Link from 'next/link'
import { getCollaborators } from '@/lib/actions/collaborators'
import { cx } from '@/lib/utils/cx'
import { formatRut, formatCurrency } from '@/lib/utils'

export default async function CollaboratorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    type: searchParams.type as 'empleado' | 'honorario' | undefined,
    estado_activo: searchParams.estado_activo === 'false' ? false : searchParams.estado_activo === 'true' ? true : undefined,
    cargo: searchParams.cargo as string | undefined,
    search: searchParams.search as string | undefined,
  }

  const collaborators = await getCollaborators(filters)

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
        <Link
          href="/nomina/colaboradores/nuevo"
          className={cx(
            'inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
          )}
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Colaborador
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Nombre, RUT, email..."
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              defaultValue={filters.type}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="empleado">Empleado</option>
              <option value="honorario">Honorario</option>
            </select>
          </div>
          <div>
            <label htmlFor="estado_activo" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado_activo"
              name="estado_activo"
              defaultValue={filters.estado_activo?.toString()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">
              Cargo
            </label>
            <input
              type="text"
              name="cargo"
              id="cargo"
              defaultValue={filters.cargo}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Director, Conductor..."
            />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Colaboradores</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{collaborators?.length || 0}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Empleados</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {collaborators?.filter((c) => c.type === 'empleado').length || 0}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Honorarios</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">
            {collaborators?.filter((c) => c.type === 'honorario').length || 0}
          </div>
        </div>
      </div>

      {/* Collaborators Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                RUT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Sueldo Base
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
            {collaborators && collaborators.length > 0 ? (
              collaborators.map((collaborator) => (
                <tr key={collaborator.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {collaborator.nombre_completo}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatRut(collaborator.rut)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        typeColors[collaborator.type] || typeColors.empleado
                      )}
                    >
                      {typeLabels[collaborator.type] || collaborator.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {collaborator.cargo || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {collaborator.type === 'empleado' && collaborator.sueldo_base
                      ? formatCurrency(collaborator.sueldo_base)
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        collaborator.estado_activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}
                    >
                      {collaborator.estado_activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/nomina/colaboradores/${collaborator.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay colaboradores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
