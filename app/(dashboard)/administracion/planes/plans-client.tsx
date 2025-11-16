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
import { formatCurrency } from '@/lib/utils'
import { createPlan, updatePlan, deletePlan } from '@/lib/actions/plans'
import type { Plan, ServiceType } from '@/types/database'

interface PlansClientProps {
  initialData: Plan[]
}

const serviceTypeLabels: Record<string, string> = {
  inhumacion: 'Inhumación',
  cremacion: 'Cremación',
  traslado_nacional: 'Traslado Nacional',
  traslado_internacional: 'Traslado Internacional',
  solo_velatorio: 'Solo Velatorio',
}

export function PlansClient({ initialData }: PlansClientProps) {
  const [plans, setPlans] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    service_type: '' as string,
    precio_base: '',
    notas: '',
    estado_activo: true,
  })

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !typeFilter || p.service_type === typeFilter
    const matchesStatus = statusFilter === '' || p.estado_activo === (statusFilter === 'true')
    return matchesSearch && matchesType && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      service_type: '',
      precio_base: '',
      notas: '',
      estado_activo: true,
    })
    setSelectedPlan(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      service_type: plan.service_type || '',
      precio_base: plan.precio_base.toString(),
      notas: plan.notas || '',
      estado_activo: plan.estado_activo,
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          service_type: (formData.service_type || null) as ServiceType | null,
          precio_base: parseFloat(formData.precio_base),
          notas: formData.notas || null,
          estado_activo: formData.estado_activo,
        }

        if (selectedPlan) {
          const updated = await updatePlan(selectedPlan.id, input)
          setPlans((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
        } else {
          const created = await createPlan(input)
          setPlans((prev) => [created, ...prev])
        }

        setIsModalOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!selectedPlan) return
    setError(null)
    startTransition(async () => {
      try {
        await deletePlan(selectedPlan.id)
        setPlans((prev) => prev.filter((p) => p.id !== selectedPlan.id))
        setIsDeleteModalOpen(false)
        setSelectedPlan(null)
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
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'inhumacion', label: 'Inhumación' },
            { value: 'cremacion', label: 'Cremación' },
            { value: 'traslado_nacional', label: 'Traslado Nacional' },
            { value: 'traslado_internacional', label: 'Traslado Internacional' },
            { value: 'solo_velatorio', label: 'Solo Velatorio' },
          ]}
          selectedKey={typeFilter}
          onSelectionChange={(key) => setTypeFilter(key as string)}
          className="w-48"
        />
        <Select
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'true', label: 'Activos' },
            { value: 'false', label: 'Inactivos' },
          ]}
          selectedKey={statusFilter}
          onSelectionChange={(key) => setStatusFilter(key as string)}
          className="w-48"
        />
        <Button onPress={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo de Servicio</TableHead>
              <TableHead align="right">Precio Base</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <EmptyTableState message="No se encontraron planes" />
            ) : (
              filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre}</TableCell>
                  <TableCell className="max-w-xs truncate">{plan.descripcion || '-'}</TableCell>
                  <TableCell>
                    {plan.service_type ? (
                      <Badge variant="info">{serviceTypeLabels[plan.service_type] || plan.service_type}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(plan.precio_base)}</TableCell>
                  <TableCell>
                    <Badge variant={plan.estado_activo ? 'success' : 'default'}>
                      {plan.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onPress={() => openEditModal(plan)}>
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => openDeleteModal(plan)}>
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

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} title={selectedPlan ? 'Editar Plan' : 'Nuevo Plan'} size="lg">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <Input
              label="Precio Base"
              required
              type="number"
              value={formData.precio_base}
              onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
            />
            <Select
              label="Tipo de Servicio"
              options={[
                { value: '', label: 'Sin tipo específico' },
                { value: 'inhumacion', label: 'Inhumación' },
                { value: 'cremacion', label: 'Cremación' },
                { value: 'traslado_nacional', label: 'Traslado Nacional' },
                { value: 'traslado_internacional', label: 'Traslado Internacional' },
                { value: 'solo_velatorio', label: 'Solo Velatorio' },
              ]}
              selectedKey={formData.service_type}
              onSelectionChange={(key) => setFormData({ ...formData, service_type: key as string })}
            />
          </div>
          <TextArea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
          <TextArea
            label="Notas"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.estado_activo}
              onChange={(e) => setFormData({ ...formData, estado_activo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Activo</span>
          </label>
        </div>
        <ModalFooter>
          <Button variant="secondary" onPress={() => setIsModalOpen(false)} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} isLoading={isPending} loadingText="Guardando...">
            {selectedPlan ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Eliminar Plan" size="sm">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el plan <strong>{selectedPlan?.nombre}</strong>? Esta acción no se
            puede deshacer.
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
