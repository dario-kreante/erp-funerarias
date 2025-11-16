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
import { createCollaborator, updateCollaborator, deleteCollaborator } from '@/lib/actions/collaborators'
import type { Collaborator, Branch } from '@/types/database'

type CollaboratorWithBranch = Collaborator & { branch?: Branch | null }

interface CollaboratorsClientProps {
  initialData: CollaboratorWithBranch[]
}

export function CollaboratorsClient({ initialData }: CollaboratorsClientProps) {
  const [collaborators, setCollaborators] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorWithBranch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formData, setFormData] = useState({
    nombre_completo: '',
    rut: '',
    type: 'empleado' as 'empleado' | 'honorario',
    cargo: '',
    telefono: '',
    email: '',
    sueldo_base: '',
    metodo_pago: '',
    estado_activo: true,
    notas: '',
  })

  const filteredCollaborators = collaborators.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rut.includes(searchTerm) ||
      (c.cargo && c.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !typeFilter || c.type === typeFilter
    const matchesStatus = statusFilter === '' || c.estado_activo === (statusFilter === 'true')
    return matchesSearch && matchesType && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      rut: '',
      type: 'empleado',
      cargo: '',
      telefono: '',
      email: '',
      sueldo_base: '',
      metodo_pago: '',
      estado_activo: true,
      notas: '',
    })
    setSelectedCollaborator(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (collaborator: CollaboratorWithBranch) => {
    setSelectedCollaborator(collaborator)
    setFormData({
      nombre_completo: collaborator.nombre_completo,
      rut: collaborator.rut,
      type: collaborator.type,
      cargo: collaborator.cargo || '',
      telefono: collaborator.telefono || '',
      email: collaborator.email || '',
      sueldo_base: collaborator.sueldo_base?.toString() || '',
      metodo_pago: collaborator.metodo_pago || '',
      estado_activo: collaborator.estado_activo,
      notas: collaborator.notas || '',
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (collaborator: CollaboratorWithBranch) => {
    setSelectedCollaborator(collaborator)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          ...formData,
          sueldo_base: formData.sueldo_base ? parseFloat(formData.sueldo_base) : null,
          cargo: formData.cargo || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          metodo_pago: formData.metodo_pago || null,
          notas: formData.notas || null,
        }

        if (selectedCollaborator) {
          const updated = await updateCollaborator(selectedCollaborator.id, input)
          setCollaborators((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
        } else {
          const created = await createCollaborator(input)
          setCollaborators((prev) => [created, ...prev])
        }

        setIsModalOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!selectedCollaborator) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteCollaborator(selectedCollaborator.id)
        setCollaborators((prev) => prev.filter((c) => c.id !== selectedCollaborator.id))
        setIsDeleteModalOpen(false)
        setSelectedCollaborator(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <SearchMd className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, RUT o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'empleado', label: 'Empleado' },
            { value: 'honorario', label: 'Honorario' },
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
          Nuevo Colaborador
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead align="right">Sueldo Base</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCollaborators.length === 0 ? (
              <EmptyTableState message="No se encontraron colaboradores" />
            ) : (
              filteredCollaborators.map((collaborator) => (
                <TableRow key={collaborator.id}>
                  <TableCell className="font-medium">{collaborator.nombre_completo}</TableCell>
                  <TableCell>{collaborator.rut}</TableCell>
                  <TableCell>
                    <Badge variant={collaborator.type === 'empleado' ? 'primary' : 'info'}>
                      {collaborator.type === 'empleado' ? 'Empleado' : 'Honorario'}
                    </Badge>
                  </TableCell>
                  <TableCell>{collaborator.cargo || '-'}</TableCell>
                  <TableCell>{collaborator.telefono || '-'}</TableCell>
                  <TableCell align="right">
                    {collaborator.sueldo_base ? formatCurrency(collaborator.sueldo_base) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={collaborator.estado_activo ? 'success' : 'default'}>
                      {collaborator.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onPress={() => openEditModal(collaborator)}>
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => openDeleteModal(collaborator)}>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={selectedCollaborator ? 'Editar Colaborador' : 'Nuevo Colaborador'}
        size="lg"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre Completo"
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            />
            <Input
              label="RUT"
              required
              placeholder="12.345.678-9"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            />
            <Select
              label="Tipo"
              required
              options={[
                { value: 'empleado', label: 'Empleado' },
                { value: 'honorario', label: 'Honorario' },
              ]}
              selectedKey={formData.type}
              onSelectionChange={(key) => setFormData({ ...formData, type: key as 'empleado' | 'honorario' })}
            />
            <Input
              label="Cargo"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            />
            <Input
              label="Teléfono"
              placeholder="+56912345678"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Sueldo Base"
              type="number"
              value={formData.sueldo_base}
              onChange={(e) => setFormData({ ...formData, sueldo_base: e.target.value })}
            />
            <Input
              label="Método de Pago"
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
            />
          </div>
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
            {selectedCollaborator ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Eliminar Colaborador" size="sm">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar a <strong>{selectedCollaborator?.nombre_completo}</strong>? Esta
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
