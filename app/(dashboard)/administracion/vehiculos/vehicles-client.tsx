'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyTableState } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { TextArea } from '@/components/ui/TextArea'
import { Plus, Edit03, Trash01, SearchMd } from '@untitledui/icons'
import { createVehicle, updateVehicle, deleteVehicle } from '@/lib/actions/vehicles'
import type { Vehicle, Branch } from '@/types/database'

type VehicleWithBranch = Vehicle & { branch?: Branch | null }

interface VehiclesClientProps {
  initialData: VehicleWithBranch[]
}

export function VehiclesClient({ initialData }: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithBranch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    placa: '',
    tipo_vehiculo: '',
    capacidad: '',
    estado: 'disponible' as 'disponible' | 'en_mantenimiento',
    notas: '',
  })

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      !searchTerm ||
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.tipo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || v.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      placa: '',
      tipo_vehiculo: '',
      capacidad: '',
      estado: 'disponible',
      notas: '',
    })
    setSelectedVehicle(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (vehicle: VehicleWithBranch) => {
    setSelectedVehicle(vehicle)
    setFormData({
      placa: vehicle.placa,
      tipo_vehiculo: vehicle.tipo_vehiculo,
      capacidad: vehicle.capacidad?.toString() || '',
      estado: vehicle.estado,
      notas: vehicle.notas || '',
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (vehicle: VehicleWithBranch) => {
    setSelectedVehicle(vehicle)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          placa: formData.placa,
          tipo_vehiculo: formData.tipo_vehiculo,
          capacidad: formData.capacidad ? parseInt(formData.capacidad) : null,
          estado: formData.estado,
          notas: formData.notas || null,
        }

        if (selectedVehicle) {
          const updated = await updateVehicle(selectedVehicle.id, input)
          setVehicles((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)))
        } else {
          const created = await createVehicle(input)
          setVehicles((prev) => [created, ...prev])
        }

        setIsModalOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!selectedVehicle) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteVehicle(selectedVehicle.id)
        setVehicles((prev) => prev.filter((v) => v.id !== selectedVehicle.id))
        setIsDeleteModalOpen(false)
        setSelectedVehicle(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <SearchMd className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por placa o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'disponible', label: 'Disponible' },
            { value: 'en_mantenimiento', label: 'En Mantenimiento' },
          ]}
          selectedKey={statusFilter}
          onSelectionChange={(key) => setStatusFilter(key as string)}
          className="w-48"
        />
        <Button onPress={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo de Vehículo</TableHead>
              <TableHead align="center">Capacidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <EmptyTableState message="No se encontraron vehículos" />
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.placa}</TableCell>
                  <TableCell>{vehicle.tipo_vehiculo}</TableCell>
                  <TableCell align="center">{vehicle.capacidad || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={vehicle.estado === 'disponible' ? 'success' : 'warning'}>
                      {vehicle.estado === 'disponible' ? 'Disponible' : 'En Mantenimiento'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{vehicle.notas || '-'}</TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onPress={() => openEditModal(vehicle)}>
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => openDeleteModal(vehicle)}>
                        <Trash01 className="h-4 w-4 text-error-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={selectedVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="lg"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Placa"
              required
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
            />
            <Input
              label="Tipo de Vehículo"
              required
              placeholder="Carroza, Van, etc."
              value={formData.tipo_vehiculo}
              onChange={(e) => setFormData({ ...formData, tipo_vehiculo: e.target.value })}
            />
            <Input
              label="Capacidad"
              type="number"
              value={formData.capacidad}
              onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
            />
            <Select
              label="Estado"
              options={[
                { value: 'disponible', label: 'Disponible' },
                { value: 'en_mantenimiento', label: 'En Mantenimiento' },
              ]}
              selectedKey={formData.estado}
              onSelectionChange={(key) =>
                setFormData({ ...formData, estado: key as 'disponible' | 'en_mantenimiento' })
              }
            />
          </div>
          <TextArea
            label="Notas"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onPress={() => setIsModalOpen(false)} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} isLoading={isPending} loadingText="Guardando...">
            {selectedVehicle ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Eliminar Vehículo" size="sm">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el vehículo con placa <strong>{selectedVehicle?.placa}</strong>? Esta
            acción no se puede deshacer.
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onPress={() => setIsDeleteModalOpen(false)} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button variant="danger" onPress={handleDelete} isLoading={isPending} loadingText="Eliminando...">
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
