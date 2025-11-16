'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { eventTypeEnum, eventStatusEnum } from '@/lib/validations/common'
import {
  createAgendaEvent,
  updateAgendaEvent,
  checkResourceConflict,
  getAvailableRooms,
  getAvailableVehicles,
  getAvailableCollaborators,
} from '@/lib/actions/agenda'
import type { EventType, ResourceType, Room, Vehicle, Collaborator } from '@/types/database'

const eventFormSchema = z
  .object({
    titulo: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
    descripcion: z.string().optional(),
    tipo_evento: eventTypeEnum,
    fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
    fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
    todo_el_dia: z.boolean().default(false),
    estado: eventStatusEnum.default('programado'),
    notas: z.string().optional(),
    // Resource selections
    sala_id: z.string().optional(),
    vehiculo_id: z.string().optional(),
    colaboradores_ids: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.fecha_inicio)
      const end = new Date(data.fecha_fin)
      return end > start
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['fecha_fin'],
    }
  )

type EventFormData = z.infer<typeof eventFormSchema>

interface EventFormProps {
  funeralHomeId: string
  branchId: string
  initialData?: Partial<EventFormData> & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function EventForm({ funeralHomeId, branchId, initialData, onSuccess, onCancel }: EventFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<{ resource: string; message: string }[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>([])
  const [loadingResources, setLoadingResources] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema) as never,
    defaultValues: {
      titulo: initialData?.titulo || '',
      descripcion: initialData?.descripcion || '',
      tipo_evento: initialData?.tipo_evento || 'otro',
      fecha_inicio: initialData?.fecha_inicio || '',
      fecha_fin: initialData?.fecha_fin || '',
      todo_el_dia: initialData?.todo_el_dia || false,
      estado: initialData?.estado || 'programado',
      notas: initialData?.notas || '',
      sala_id: initialData?.sala_id || '',
      vehiculo_id: initialData?.vehiculo_id || '',
      colaboradores_ids: initialData?.colaboradores_ids || [],
    },
  })

  const fechaInicio = watch('fecha_inicio')
  const fechaFin = watch('fecha_fin')
  const salaId = watch('sala_id')
  const vehiculoId = watch('vehiculo_id')

  // Load available resources when dates change
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const loadResources = async () => {
        setLoadingResources(true)
        try {
          const [rooms, vehicles, collaborators] = await Promise.all([
            getAvailableRooms(branchId, fechaInicio, fechaFin),
            getAvailableVehicles(branchId, fechaInicio, fechaFin),
            getAvailableCollaborators(branchId, fechaInicio, fechaFin),
          ])
          setAvailableRooms(rooms)
          setAvailableVehicles(vehicles)
          setAvailableCollaborators(collaborators)
        } catch (err) {
          console.error('Error loading resources:', err)
        } finally {
          setLoadingResources(false)
        }
      }
      loadResources()
    }
  }, [fechaInicio, fechaFin, branchId])

  // Check for conflicts when resources are selected
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return

    const checkConflicts = async () => {
      const newConflicts: { resource: string; message: string }[] = []

      if (salaId) {
        const roomConflicts = await checkResourceConflict('sala', salaId, fechaInicio, fechaFin, initialData?.id)
        if (roomConflicts.length > 0) {
          newConflicts.push({
            resource: 'Sala',
            message: `La sala está reservada para "${roomConflicts[0].titulo}"`,
          })
        }
      }

      if (vehiculoId) {
        const vehicleConflicts = await checkResourceConflict(
          'vehiculo',
          vehiculoId,
          fechaInicio,
          fechaFin,
          initialData?.id
        )
        if (vehicleConflicts.length > 0) {
          newConflicts.push({
            resource: 'Vehículo',
            message: `El vehículo está reservado para "${vehicleConflicts[0].titulo}"`,
          })
        }
      }

      setConflicts(newConflicts)
    }

    checkConflicts()
  }, [salaId, vehiculoId, fechaInicio, fechaFin, initialData?.id])

  const onSubmit = async (data: EventFormData) => {
    if (conflicts.length > 0) {
      setError('Hay conflictos de recursos que deben ser resueltos antes de guardar')
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const eventData = {
          funeral_home_id: funeralHomeId,
          branch_id: branchId,
          titulo: data.titulo,
          descripcion: data.descripcion || null,
          tipo_evento: data.tipo_evento as EventType,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          todo_el_dia: data.todo_el_dia,
          estado: data.estado,
          notas: data.notas || null,
          es_recurrente: false,
          patron_recurrencia: null,
          color: null,
          service_id: null,
          created_by: null,
        }

        // Build resources array
        const resources: { tipo_recurso: ResourceType; recurso_id: string }[] = []

        if (data.sala_id) {
          resources.push({ tipo_recurso: 'sala', recurso_id: data.sala_id })
        }

        if (data.vehiculo_id) {
          resources.push({ tipo_recurso: 'vehiculo', recurso_id: data.vehiculo_id })
        }

        if (data.colaboradores_ids && data.colaboradores_ids.length > 0) {
          for (const colabId of data.colaboradores_ids) {
            resources.push({ tipo_recurso: 'colaborador', recurso_id: colabId })
          }
        }

        if (initialData?.id) {
          await updateAgendaEvent(initialData.id, eventData)
        } else {
          await createAgendaEvent(eventData, resources)
        }

        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar el evento')
      }
    })
  }

  const eventTypeOptions = [
    { value: 'velatorio', label: 'Velatorio' },
    { value: 'ceremonia', label: 'Ceremonia' },
    { value: 'cremacion', label: 'Cremación' },
    { value: 'inhumacion', label: 'Inhumación' },
    { value: 'recogida', label: 'Recogida' },
    { value: 'reunion', label: 'Reunión' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otro', label: 'Otro' },
  ]

  const statusOptions = [
    { value: 'programado', label: 'Programado' },
    { value: 'en_progreso', label: 'En progreso' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {conflicts.length > 0 && (
        <Alert variant="warning">
          <div className="font-medium mb-2">Conflictos detectados:</div>
          <ul className="list-disc list-inside space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index}>
                <strong>{conflict.resource}:</strong> {conflict.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Título del evento"
            {...register('titulo')}
            errorMessage={errors.titulo?.message}
            required
            placeholder="Ej: Velatorio Sr. González"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Tipo de evento <span className="text-error-500">*</span>
          </label>
          <select
            {...register('tipo_evento')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.tipo_evento?.message && (
            <p className="text-xs text-error-600">{errors.tipo_evento.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <select
            {...register('estado')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.estado?.message && (
            <p className="text-xs text-error-600">{errors.estado.message}</p>
          )}
        </div>

        <DatePicker
          label="Fecha y hora de inicio"
          type="datetime-local"
          {...register('fecha_inicio')}
          errorMessage={errors.fecha_inicio?.message}
          required
        />

        <DatePicker
          label="Fecha y hora de fin"
          type="datetime-local"
          {...register('fecha_fin')}
          errorMessage={errors.fecha_fin?.message}
          required
        />

        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            {...register('todo_el_dia')}
            id="todo_el_dia"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="todo_el_dia" className="text-sm text-gray-700">
            Evento de todo el día
          </label>
        </div>

        <div className="md:col-span-2">
          <TextArea
            label="Descripción"
            {...register('descripcion')}
            errorMessage={errors.descripcion?.message}
            placeholder="Detalles adicionales del evento..."
            rows={3}
          />
        </div>
      </div>

      {/* Resource Selection */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recursos</h3>

        {loadingResources ? (
          <div className="text-sm text-gray-500">Cargando recursos disponibles...</div>
        ) : !fechaInicio || !fechaFin ? (
          <div className="text-sm text-gray-500">Seleccione las fechas para ver los recursos disponibles</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Sala (opcional)</label>
              <select
                {...register('sala_id')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Sin sala asignada</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.nombre} {room.capacidad ? `(${room.capacidad} personas)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Vehículo (opcional)</label>
              <select
                {...register('vehiculo_id')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Sin vehículo asignado</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.placa} - {vehicle.tipo_vehiculo}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Colaboradores (opcional)
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                {availableCollaborators.length === 0 ? (
                  <div className="text-sm text-gray-500">No hay colaboradores disponibles</div>
                ) : (
                  <div className="space-y-2">
                    {availableCollaborators.map((collaborator) => (
                      <label key={collaborator.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={collaborator.id}
                          {...register('colaboradores_ids')}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {collaborator.nombre_completo}
                          {collaborator.cargo && (
                            <span className="text-gray-500 ml-1">({collaborator.cargo})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <TextArea
          label="Notas adicionales"
          {...register('notas')}
          errorMessage={errors.notas?.message}
          placeholder="Información adicional..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="secondary" onPress={onCancel} isDisabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" isDisabled={isPending || conflicts.length > 0}>
          {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar evento' : 'Crear evento'}
        </Button>
      </div>
    </form>
  )
}
