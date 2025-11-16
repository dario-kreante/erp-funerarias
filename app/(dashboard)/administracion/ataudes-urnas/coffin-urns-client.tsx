'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyTableState } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Plus, Edit03, Trash01, SearchMd } from '@untitledui/icons'
import { formatCurrency } from '@/lib/utils'
import { createCoffinUrn, updateCoffinUrn, deleteCoffinUrn } from '@/lib/actions/coffin-urns'
import type { CoffinUrn, Supplier } from '@/types/database'

type CoffinUrnWithSupplier = CoffinUrn & { supplier?: Supplier | null }

interface CoffinUrnsClientProps {
  initialData: CoffinUrnWithSupplier[]
}

const categoryLabels: Record<string, string> = {
  economico: 'Económico',
  estandar: 'Estándar',
  premium: 'Premium',
}

const sizeLabels: Record<string, string> = {
  adulto: 'Adulto',
  infantil: 'Infantil',
  especial: 'Especial',
}

export function CoffinUrnsClient({ initialData }: CoffinUrnsClientProps) {
  const [coffinUrns, setCoffinUrns] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CoffinUrnWithSupplier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    tipo: 'ataud' as 'ataud' | 'urna',
    nombre_comercial: '',
    sku: '',
    material: '',
    tamano: '',
    categoria: '',
    precio_venta: '',
    costo: '',
    stock_disponible: '0',
    estado_activo: true,
  })

  const filteredItems = coffinUrns.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.material && item.material.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !typeFilter || item.tipo === typeFilter
    const matchesCategory = !categoryFilter || item.categoria === categoryFilter
    const matchesStatus = statusFilter === '' || item.estado_activo === (statusFilter === 'true')
    return matchesSearch && matchesType && matchesCategory && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      tipo: 'ataud',
      nombre_comercial: '',
      sku: '',
      material: '',
      tamano: '',
      categoria: '',
      precio_venta: '',
      costo: '',
      stock_disponible: '0',
      estado_activo: true,
    })
    setSelectedItem(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (item: CoffinUrnWithSupplier) => {
    setSelectedItem(item)
    setFormData({
      tipo: item.tipo,
      nombre_comercial: item.nombre_comercial,
      sku: item.sku || '',
      material: item.material || '',
      tamano: item.tamano || '',
      categoria: item.categoria || '',
      precio_venta: item.precio_venta.toString(),
      costo: item.costo?.toString() || '',
      stock_disponible: item.stock_disponible.toString(),
      estado_activo: item.estado_activo,
    })
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (item: CoffinUrnWithSupplier) => {
    setSelectedItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const input = {
          tipo: formData.tipo,
          nombre_comercial: formData.nombre_comercial,
          sku: formData.sku || null,
          material: formData.material || null,
          tamano: (formData.tamano || null) as 'adulto' | 'infantil' | 'especial' | null,
          categoria: (formData.categoria || null) as 'economico' | 'estandar' | 'premium' | null,
          precio_venta: parseFloat(formData.precio_venta),
          costo: formData.costo ? parseFloat(formData.costo) : null,
          stock_disponible: parseInt(formData.stock_disponible),
          estado_activo: formData.estado_activo,
        }

        if (selectedItem) {
          const updated = await updateCoffinUrn(selectedItem.id, input)
          setCoffinUrns((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
        } else {
          const created = await createCoffinUrn(input)
          setCoffinUrns((prev) => [created, ...prev])
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
        await deleteCoffinUrn(selectedItem.id)
        setCoffinUrns((prev) => prev.filter((item) => item.id !== selectedItem.id))
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
            placeholder="Buscar por nombre, SKU o material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputClassName="pl-10"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'ataud', label: 'Ataúd' },
            { value: 'urna', label: 'Urna' },
          ]}
          selectedKey={typeFilter}
          onSelectionChange={(key) => setTypeFilter(key as string)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: 'Todas las categorías' },
            { value: 'economico', label: 'Económico' },
            { value: 'estandar', label: 'Estándar' },
            { value: 'premium', label: 'Premium' },
          ]}
          selectedKey={categoryFilter}
          onSelectionChange={(key) => setCategoryFilter(key as string)}
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
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre Comercial</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead align="right">Precio Venta</TableHead>
              <TableHead align="right">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <EmptyTableState message="No se encontraron ataúdes o urnas" />
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={item.tipo === 'ataud' ? 'primary' : 'info'}>
                      {item.tipo === 'ataud' ? 'Ataúd' : 'Urna'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.nombre_comercial}</TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell>{item.material || '-'}</TableCell>
                  <TableCell>{item.tamano ? sizeLabels[item.tamano] || item.tamano : '-'}</TableCell>
                  <TableCell>
                    {item.categoria ? (
                      <Badge
                        variant={
                          item.categoria === 'premium' ? 'warning' : item.categoria === 'estandar' ? 'info' : 'default'
                        }
                      >
                        {categoryLabels[item.categoria] || item.categoria}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.precio_venta)}</TableCell>
                  <TableCell align="right">{item.stock_disponible}</TableCell>
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
        title={selectedItem ? 'Editar Ataúd/Urna' : 'Nuevo Ataúd/Urna'}
        size="lg"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo"
              required
              options={[
                { value: 'ataud', label: 'Ataúd' },
                { value: 'urna', label: 'Urna' },
              ]}
              selectedKey={formData.tipo}
              onSelectionChange={(key) => setFormData({ ...formData, tipo: key as 'ataud' | 'urna' })}
            />
            <Input
              label="Nombre Comercial"
              required
              value={formData.nombre_comercial}
              onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
            />
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
            <Input
              label="Material"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            />
            <Select
              label="Tamaño"
              options={[
                { value: '', label: 'Sin especificar' },
                { value: 'adulto', label: 'Adulto' },
                { value: 'infantil', label: 'Infantil' },
                { value: 'especial', label: 'Especial' },
              ]}
              selectedKey={formData.tamano}
              onSelectionChange={(key) => setFormData({ ...formData, tamano: key as string })}
            />
            <Select
              label="Categoría"
              options={[
                { value: '', label: 'Sin categoría' },
                { value: 'economico', label: 'Económico' },
                { value: 'estandar', label: 'Estándar' },
                { value: 'premium', label: 'Premium' },
              ]}
              selectedKey={formData.categoria}
              onSelectionChange={(key) => setFormData({ ...formData, categoria: key as string })}
            />
            <Input
              label="Precio de Venta"
              required
              type="number"
              value={formData.precio_venta}
              onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
            />
            <Input
              label="Costo"
              type="number"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
            />
            <Input
              label="Stock Disponible"
              type="number"
              value={formData.stock_disponible}
              onChange={(e) => setFormData({ ...formData, stock_disponible: e.target.value })}
            />
          </div>
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

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Eliminar Ataúd/Urna" size="sm">
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar <strong>{selectedItem?.nombre_comercial}</strong>? Esta acción no se
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
