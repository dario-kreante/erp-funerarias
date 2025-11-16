'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table'
import { getRooms, createRoom, updateRoom, deleteRoom } from '@/lib/actions/agenda'
import type { Room } from '@/types/database'
import {
  PlusIcon,
  Edit03Icon,
  Trash01Icon,
  Building07Icon,
} from '@untitledui/icons-react/outline'

const roomFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  capacidad: z.number().int().positive('La capacidad debe ser mayor a 0').optional().nullable(),
  ubicacion: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser en formato hexadecimal (#RRGGBB)'),
  notas: z.string().optional(),
})

type RoomFormData = z.infer<typeof roomFormSchema>

interface RoomManagementProps {
  funeralHomeId: string
  branchId: string
}

export function RoomManagement({ funeralHomeId, branchId }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      capacidad: null,
      ubicacion: '',
      color: '#3B82F6',
      notas: '',
    },
  })

  // Load rooms
  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getRooms({ branch_id: branchId })
      setRooms(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las salas')
    } finally {
      setIsLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // Handle create/update room
  const onSubmit = async (data: RoomFormData) => {
    setError(null)
    startTransition(async () => {
      try {
        if (editingRoom) {
          await updateRoom(editingRoom.id, data)
        } else {
          await createRoom({
            funeral_home_id: funeralHomeId,
            branch_id: branchId,
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            capacidad: data.capacidad || null,
            ubicacion: data.ubicacion || null,
            equipamiento: null,
            estado_activo: true,
            color: data.color,
            notas: data.notas || null,
          })
        }
        await loadRooms()
        setShowCreateModal(false)
        setEditingRoom(null)
        reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar la sala')
      }
    })
  }

  // Handle delete room
  const handleDelete = async () => {
    if (!deletingRoom) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteRoom(deletingRoom.id)
        await loadRooms()
        setDeletingRoom(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar la sala')
      }
    })
  }

  // Open edit modal
  const openEditModal = (room: Room) => {
    setEditingRoom(room)
    setValue('nombre', room.nombre)
    setValue('descripcion', room.descripcion || '')
    setValue('capacidad', room.capacidad)
    setValue('ubicacion', room.ubicacion || '')
    setValue('color', room.color)
    setValue('notas', room.notas || '')
    setShowCreateModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowCreateModal(false)
    setEditingRoom(null)
    reset()
  }

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarillo' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#6B7280', label: 'Gris' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#14B8A6', label: 'Turquesa' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Salas</h2>
          <p className="text-sm text-gray-500">Administra las salas de velatorio y ceremonias</p>
        </div>
        <Button variant="primary" onPress={() => setShowCreateModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva sala
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando salas...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center">
            <Building07Icon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No hay salas registradas</p>
            <Button variant="primary" className="mt-4" onPress={() => setShowCreateModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Crear primera sala
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{room.nombre}</div>
                    {room.descripcion && (
                      <div className="text-xs text-gray-500 mt-1">{room.descripcion}</div>
                    )}
                  </TableCell>
                  <TableCell>{room.ubicacion || '-'}</TableCell>
                  <TableCell>
                    {room.capacidad ? `${room.capacidad} personas` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.estado_activo ? 'success' : 'warning'}>
                      {room.estado_activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: room.color }}
                      title={room.color}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => openEditModal(room)}
                      >
                        <Edit03Icon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setDeletingRoom(room)}
                      >
                        <Trash01Icon className="w-4 h-4 text-error-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onOpenChange={(open) => !open && closeModal()}
        title={editingRoom ? 'Editar sala' : 'Nueva sala'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre de la sala"
            {...register('nombre')}
            errorMessage={errors.nombre?.message}
            required
            placeholder="Ej: Sala Principal"
          />

          <TextArea
            label="Descripción"
            {...register('descripcion')}
            errorMessage={errors.descripcion?.message}
            placeholder="Descripción de la sala..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacidad (personas)"
              type="number"
              {...register('capacidad', { valueAsNumber: true })}
              errorMessage={errors.capacidad?.message}
              placeholder="Ej: 50"
            />

            <Input
              label="Ubicación"
              {...register('ubicacion')}
              errorMessage={errors.ubicacion?.message}
              placeholder="Ej: Primer piso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Color en calendario
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...register('color')}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-300 transition-colors"
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                </label>
              ))}
            </div>
            {errors.color && (
              <p className="text-xs text-error-600 mt-1">{errors.color.message}</p>
            )}
          </div>

          <TextArea
            label="Notas"
            {...register('notas')}
            errorMessage={errors.notas?.message}
            placeholder="Notas adicionales..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onPress={closeModal} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isDisabled={isPending}>
              {isPending ? 'Guardando...' : editingRoom ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRoom}
        onOpenChange={(open) => !open && setDeletingRoom(null)}
        title="Eliminar sala"
      >
        <div className="space-y-4">
          <Alert variant="warning">
            ¿Está seguro de eliminar la sala &ldquo;{deletingRoom?.nombre}&rdquo;?
            <br />
            <span className="text-sm">
              Esta acción no se puede deshacer y eliminará todas las reservas asociadas.
            </span>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onPress={() => setDeletingRoom(null)}
              isDisabled={isPending}
            >
              Cancelar
            </Button>
            <Button variant="danger" onPress={handleDelete} isDisabled={isPending}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
