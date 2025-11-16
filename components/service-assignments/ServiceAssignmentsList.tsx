'use client'

import { useState, useEffect } from 'react'
import { getServiceAssignments, deleteServiceAssignment } from '@/lib/actions/service-assignments'
import { cx } from '@/lib/utils/cx'
import { formatCurrency } from '@/lib/utils'

interface ServiceAssignmentsListProps {
  serviceId: string
  onAddClick: () => void
}

export function ServiceAssignmentsList({ serviceId, onAddClick }: ServiceAssignmentsListProps) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = async () => {
    try {
      const data = await getServiceAssignments(serviceId)
      setAssignments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asignaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [serviceId])

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('¿Está seguro de eliminar esta asignación?')) return

    try {
      await deleteServiceAssignment(assignmentId)
      setAssignments(assignments.filter((a) => a.id !== assignmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const typeColors: Record<string, string> = {
    empleado: 'bg-blue-100 text-blue-800',
    honorario: 'bg-purple-100 text-purple-800',
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 rounded bg-gray-200"></div>
        <div className="mt-2 h-10 rounded bg-gray-200"></div>
      </div>
    )
  }

  if (error) {
    return <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
  }

  const totalExtras = assignments.reduce((sum, a) => sum + (a.monto_extra || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Colaboradores Asignados ({assignments.length})
        </h3>
        <button
          onClick={onAddClick}
          className={cx(
            'inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-blue-500'
          )}
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Asignar
        </button>
      </div>

      {assignments.length > 0 ? (
        <>
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol en Servicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo Extra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Monto Extra
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {assignment.collaborator.nombre_completo}
                      <div className="text-xs text-gray-500">{assignment.collaborator.cargo || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          typeColors[assignment.collaborator.type] || typeColors.empleado
                        )}
                      >
                        {assignment.collaborator.type}
                      </span>
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
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Total Extras:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(totalExtras)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin colaboradores asignados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Agregue colaboradores para este servicio haciendo clic en &quot;Asignar&quot;
          </p>
        </div>
      )}
    </div>
  )
}
