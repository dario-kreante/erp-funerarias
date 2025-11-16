'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCollaborators } from '@/lib/actions/collaborators'
import { createServiceAssignment } from '@/lib/actions/service-assignments'
import { serviceRoles, extraTypes } from '@/lib/validations/service-assignment'
import { cx } from '@/lib/utils/cx'

interface AddServiceAssignmentFormProps {
  serviceId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddServiceAssignmentForm({
  serviceId,
  onClose,
  onSuccess,
}: AddServiceAssignmentFormProps) {
  const router = useRouter()
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    collaborator_id: '',
    rol_en_servicio: 'asistente',
    tipo_extra: 'ninguno',
    monto_extra: 0,
    comentarios: '',
  })

  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        const data = await getCollaborators({ estado_activo: true })
        setCollaborators(data)
      } catch (err) {
        setError('Error al cargar colaboradores')
      }
    }
    loadCollaborators()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createServiceAssignment({
        service_id: serviceId,
        collaborator_id: formData.collaborator_id,
        rol_en_servicio: formData.rol_en_servicio,
        tipo_extra: formData.tipo_extra,
        monto_extra: formData.monto_extra,
        comentarios: formData.comentarios || null,
      })
      router.refresh()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar colaborador')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    director_funerario: 'Director Funerario',
    embalsamador: 'Embalsamador',
    conductor: 'Conductor',
    asistente: 'Asistente',
    recepcionista: 'Recepcionista',
    tanatologo: 'Tanatólogo',
  }

  const extraTypeLabels: Record<string, string> = {
    ninguno: 'Ninguno',
    horas_extra: 'Horas Extra',
    servicio_especial: 'Servicio Especial',
    disponibilidad: 'Disponibilidad',
    traslado_largo: 'Traslado Largo',
    otro: 'Otro',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Asignar Colaborador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="collaborator_id" className="block text-sm font-medium text-gray-700">
              Colaborador *
            </label>
            <select
              id="collaborator_id"
              name="collaborator_id"
              required
              value={formData.collaborator_id}
              onChange={(e) => setFormData({ ...formData, collaborator_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar colaborador...</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo} - {c.type} {c.cargo ? `(${c.cargo})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rol_en_servicio" className="block text-sm font-medium text-gray-700">
              Rol en el Servicio *
            </label>
            <select
              id="rol_en_servicio"
              name="rol_en_servicio"
              required
              value={formData.rol_en_servicio}
              onChange={(e) => setFormData({ ...formData, rol_en_servicio: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {serviceRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role] || role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo_extra" className="block text-sm font-medium text-gray-700">
              Tipo de Extra
            </label>
            <select
              id="tipo_extra"
              name="tipo_extra"
              value={formData.tipo_extra}
              onChange={(e) => setFormData({ ...formData, tipo_extra: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {extraTypes.map((type) => (
                <option key={type} value={type}>
                  {extraTypeLabels[type] || type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="monto_extra" className="block text-sm font-medium text-gray-700">
              Monto Extra (CLP)
            </label>
            <input
              type="number"
              id="monto_extra"
              name="monto_extra"
              min="0"
              step="1000"
              value={formData.monto_extra}
              onChange={(e) => setFormData({ ...formData, monto_extra: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700">
              Comentarios
            </label>
            <textarea
              id="comentarios"
              name="comentarios"
              rows={3}
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Notas adicionales..."
            />
          </div>

          {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.collaborator_id}
              className={cx(
                'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white',
                'hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
