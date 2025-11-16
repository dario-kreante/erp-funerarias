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
import {
  createCemeteryCrematorium,
  updateCemeteryCrematorium,
  deleteCemeteryCrematorium,
} from '@/lib/actions/cemetery-crematoriums'
import type { CemeteryCrematorium } from '@/types/database'

interface CemeteryCrematoriumsClientProps {
  initialData: CemeteryCrematorium[]
}

export function CemeteryCrematoriumsClient({ initialData }: CemeteryCrematoriumsClientProps) {
  const [items, setItems] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CemeteryCrematorium | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'cementerio' as 'cementerio' | 'crematorio',
    direccion: '',
    informacion_contacto: '',
    notas: '',
    estado_activo: true,
  })

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.direccion && item.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !typeFilter || item.tipo === typeFilter
    const matchesStatus = statusFilter === '' || item.estado_activo === (statusFilter === 'true')
    return matchesSearch && matchesType && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'cementerio',
      direccion: '',
      informacion_contacto: '',
      notas: '',
      estado_activo: true,
    })
    setSelectedItem(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (item: CemeteryCrematorium) => {
    setSelectedItem(item)
    setFormData({
      nombre: item.nombre,
      tipo: item.tipo,
      direccion: item.direccion || '',
      informacion_contacto: item.informacion_contacto || '',
      notas: item.notas || '',
      estado_activo: item.estado_activo,
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (item: CemeteryCrematorium) => {
    setSelectedItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          nombre: formData.nombre,
          tipo: formData.tipo,
          direccion: formData.direccion || null,
          informacion_contacto: formData.informacion_contacto || null,
          notas: formData.notas || null,
          estado_activo: formData.estado_activo,
        }

        if (selectedItem) {
          const updated = await updateCemeteryCrematorium(selectedItem.id, input)
          setItems((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
        } else {
          const created = await createCemeteryCrematorium(input)
          setItems((prev) => [created, ...prev])
        }

        setIsModalOpen(false)
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!selectedItem) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteCemeteryCrematorium(selectedItem.id)
        setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
        setIsDeleteModalOpen(false)
        setSelectedItem(null)
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
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'cementerio', label: 'Cementerio' },
            { value: 'crematorio', label: 'Crematorio' },
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
          Nuevo
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Información de Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <EmptyTableState message="No se encontraron cementerios o crematorios" />
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={item.tipo === 'cementerio' ? 'primary' : 'warning'}>
                      {item.tipo === 'cementerio' ? 'Cementerio' : 'Crematorio'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.direccion || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.informacion_contacto || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.estado_activo ? 'success' : 'default'}>
                      {item.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onPress={() => openEditModal(item)}>
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => openDeleteModal(item)}>
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
        title={selectedItem ? 'Editar Cementerio/Crematorio' : 'Nuevo Cementerio/Crematorio'}
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
            <Select
              label="Tipo"
              required
              options={[
                { value: 'cementerio', label: 'Cementerio' },
                { value: 'crematorio', label: 'Crematorio' },
              ]}
              selectedKey={formData.tipo}
              onSelectionChange={(key) => setFormData({ ...formData, tipo: key as 'cementerio' | 'crematorio' })}
            />
          </div>
          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          />
          <TextArea
            label="Información de Contacto"
            value={formData.informacion_contacto}
            onChange={(e) => setFormData({ ...formData, informacion_contacto: e.target.value })}
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
            {selectedItem ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Eliminar Cementerio/Crematorio"
        size="sm"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar <strong>{selectedItem?.nombre}</strong>? Esta acción no se puede
            deshacer.
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
