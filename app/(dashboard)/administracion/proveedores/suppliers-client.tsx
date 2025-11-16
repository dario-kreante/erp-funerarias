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
import { createSupplier, updateSupplier, deleteSupplier } from '@/lib/actions/suppliers'
import type { Supplier } from '@/types/database'

interface SuppliersClientProps {
  initialData: Supplier[]
}

export function SuppliersClient({ initialData }: SuppliersClientProps) {
  const [suppliers, setSuppliers] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    tipo_negocio: '',
    informacion_contacto: '',
    estado_activo: true,
  })

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rut && s.rut.includes(searchTerm)) ||
      (s.tipo_negocio && s.tipo_negocio.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === '' || s.estado_activo === (statusFilter === 'true')
    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      rut: '',
      tipo_negocio: '',
      informacion_contacto: '',
      estado_activo: true,
    })
    setSelectedSupplier(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      nombre: supplier.nombre,
      rut: supplier.rut || '',
      tipo_negocio: supplier.tipo_negocio || '',
      informacion_contacto: supplier.informacion_contacto || '',
      estado_activo: supplier.estado_activo,
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          nombre: formData.nombre,
          rut: formData.rut || null,
          tipo_negocio: formData.tipo_negocio || null,
          informacion_contacto: formData.informacion_contacto || null,
          estado_activo: formData.estado_activo,
        }

        if (selectedSupplier) {
          const updated = await updateSupplier(selectedSupplier.id, input)
          setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))
        } else {
          const created = await createSupplier(input)
          setSuppliers((prev) => [created, ...prev])
        }

        setIsModalOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!selectedSupplier) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteSupplier(selectedSupplier.id)
        setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id))
        setIsDeleteModalOpen(false)
        setSelectedSupplier(null)
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
            placeholder="Buscar por nombre, RUT o tipo de negocio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
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
          Nuevo Proveedor
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Tipo de Negocio</TableHead>
              <TableHead>Información de Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <EmptyTableState message="No se encontraron proveedores" />
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.nombre}</TableCell>
                  <TableCell>{supplier.rut || '-'}</TableCell>
                  <TableCell>{supplier.tipo_negocio || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{supplier.informacion_contacto || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.estado_activo ? 'success' : 'default'}>
                      {supplier.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onPress={() => openEditModal(supplier)}>
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => openDeleteModal(supplier)}>
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
        title={selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
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
              label="RUT"
              placeholder="12.345.678-9"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            />
            <Input
              label="Tipo de Negocio"
              placeholder="Florería, Música, Catering, etc."
              value={formData.tipo_negocio}
              onChange={(e) => setFormData({ ...formData, tipo_negocio: e.target.value })}
            />
          </div>
          <TextArea
            label="Información de Contacto"
            value={formData.informacion_contacto}
            onChange={(e) => setFormData({ ...formData, informacion_contacto: e.target.value })}
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
            {selectedSupplier ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Eliminar Proveedor" size="sm">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar al proveedor <strong>{selectedSupplier?.nombre}</strong>? Esta acción
            no se puede deshacer.
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
