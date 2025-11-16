'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EventTypeBadge, EventStatusBadge } from './Calendar'
import { EventForm } from './EventForm'
import { deleteAgendaEvent, updateEventStatus } from '@/lib/actions/agenda'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date'
import type { AgendaEvent, EventType } from '@/types/database'
import {
  CalendarIcon,
  ClockIcon,
  File04Icon,
  Edit03Icon,
  Trash01Icon,
  CheckCircleIcon,
  XCircleIcon,
} from '@untitledui/icons-react/outline'

interface EventDetailModalProps {
  event: AgendaEvent & {
    service?: { numero_servicio: string; nombre_fallecido: string } | null
    resource_bookings?: { tipo_recurso: string; recurso_id: string }[]
  }
  funeralHomeId: string
  branchId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function EventDetailModal({
  event,
  funeralHomeId,
  branchId,
  isOpen,
  onClose,
  onUpdate,
}: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteAgendaEvent(event.id)
        onUpdate?.()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar el evento')
      }
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await updateEventStatus(event.id, newStatus)
        onUpdate?.()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar el estado')
      }
    })
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    onUpdate?.()
    onClose()
  }

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} title="Editar evento" size="lg">
        <EventForm
          funeralHomeId={funeralHomeId}
          branchId={branchId}
          initialData={{
            id: event.id,
            titulo: event.titulo,
            descripcion: event.descripcion || undefined,
            tipo_evento: event.tipo_evento,
            fecha_inicio: event.fecha_inicio,
            fecha_fin: event.fecha_fin,
            todo_el_dia: event.todo_el_dia,
            estado: event.estado,
            notas: event.notas || undefined,
          }}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} title="Detalles del evento">
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {showDeleteConfirm && (
          <Alert variant="warning">
            <div className="flex items-center justify-between">
              <span>¿Está seguro de eliminar este evento?</span>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleDelete}
                  isDisabled={isPending}
                >
                  {isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setShowDeleteConfirm(false)}
                  isDisabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{event.titulo}</h3>
              {event.service && (
                <p className="text-sm text-gray-500 mt-1">
                  Servicio #{event.service.numero_servicio} - {event.service.nombre_fallecido}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <EventTypeBadge type={event.tipo_evento as EventType} />
              <EventStatusBadge status={event.estado} />
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(event.fecha_inicio)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(event.fecha_inicio)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-700">
                  Hasta: {formatDateTime(event.fecha_fin)}
                </p>
              </div>
            </div>
            {event.todo_el_dia && (
              <div className="text-sm text-primary-600 font-medium">
                Evento de todo el día
              </div>
            )}
          </div>

          {/* Description */}
          {event.descripcion && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <File04Icon className="w-4 h-4" />
                Descripción
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {event.descripcion}
              </p>
            </div>
          )}

          {/* Notes */}
          {event.notas && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Notas</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-yellow-50 p-3 rounded-md">
                {event.notas}
              </p>
            </div>
          )}

          {/* Resources */}
          {event.resource_bookings && event.resource_bookings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recursos asignados</h4>
              <div className="flex flex-wrap gap-2">
                {event.resource_bookings.map((booking, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700"
                  >
                    {booking.tipo_recurso === 'sala' && 'Sala'}
                    {booking.tipo_recurso === 'vehiculo' && 'Vehículo'}
                    {booking.tipo_recurso === 'colaborador' && 'Colaborador'}
                    {booking.tipo_recurso === 'equipamiento' && 'Equipamiento'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick status actions */}
          {event.estado !== 'cancelado' && event.estado !== 'completado' && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Acciones rápidas</h4>
              <div className="flex flex-wrap gap-2">
                {event.estado === 'programado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => handleStatusChange('en_progreso')}
                    isDisabled={isPending}
                  >
                    Iniciar evento
                  </Button>
                )}
                {event.estado === 'en_progreso' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => handleStatusChange('completado')}
                    isDisabled={isPending}
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Marcar completado
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleStatusChange('cancelado')}
                  isDisabled={isPending}
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Cancelar evento
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            variant="danger"
            onPress={() => setShowDeleteConfirm(true)}
            isDisabled={isPending}
          >
            <Trash01Icon className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onPress={onClose}>
              Cerrar
            </Button>
            <Button variant="primary" onPress={() => setIsEditing(true)}>
              <Edit03Icon className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
