'use client'

import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyTableState,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils/date'
import { deactivateBranch, reactivateBranch, updateBranch } from '@/lib/actions/branches'
import { exportToCSV, exportToExcel, exportToPDF, formatters } from '@/lib/utils/export'
import type { Branch } from '@/types/database'
import { EditBranchForm } from './EditBranchForm'

interface BranchesTableProps {
  branches: Branch[]
}

export function BranchesTable({ branches }: BranchesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' },
  ]

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.nombre_gerente?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      !statusFilter || branch.estado_activo.toString() === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeactivate = async () => {
    if (!selectedBranch) return
    setIsLoading(true)
    setMessage(null)

    try {
      const result = selectedBranch.estado_activo
        ? await deactivateBranch({ branch_id: selectedBranch.id })
        : await reactivateBranch(selectedBranch.id)

      if (result.success) {
        setMessage({
          type: 'success',
          text: selectedBranch.estado_activo
            ? 'Sucursal desactivada correctamente'
            : 'Sucursal reactivada correctamente',
        })
        setShowDeactivateModal(false)
        setSelectedBranch(null)
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar estado de la sucursal' })
    } finally {
      setIsLoading(false)
    }
  }

  const exportColumns = [
    { key: 'nombre', header: 'Nombre', width: 150 },
    { key: 'direccion', header: 'Dirección', width: 200 },
    { key: 'telefono', header: 'Teléfono', width: 120 },
    { key: 'nombre_gerente', header: 'Gerente', width: 150 },
    {
      key: 'estado_activo',
      header: 'Estado',
      width: 80,
      format: formatters.boolean,
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      width: 120,
      format: formatters.date,
    },
  ]

  const handleExportCSV = () => {
    exportToCSV(
      filteredBranches,
      exportColumns,
      `sucursales_${new Date().toISOString().split('T')[0]}`
    )
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredBranches,
      exportColumns,
      `sucursales_${new Date().toISOString().split('T')[0]}`,
      'Sucursales'
    )
  }

  const handleExportPDF = () => {
    exportToPDF(filteredBranches, exportColumns, {
      title: 'Listado de Sucursales',
      subtitle: `Total: ${filteredBranches.length} sucursales`,
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
      )}

      {/* Filters and Export */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, dirección o gerente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(String(key))}
            placeholder="Filtrar por estado"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onPress={handleExportCSV}>
            CSV
          </Button>
          <Button variant="secondary" size="sm" onPress={handleExportExcel}>
            Excel
          </Button>
          <Button variant="secondary" size="sm" onPress={handleExportPDF}>
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Gerente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBranches.length === 0 ? (
              <EmptyTableState message="No se encontraron sucursales" />
            ) : (
              filteredBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>
                    <span className="font-medium">{branch.nombre}</span>
                  </TableCell>
                  <TableCell>{branch.direccion || '-'}</TableCell>
                  <TableCell>{branch.telefono || '-'}</TableCell>
                  <TableCell>{branch.nombre_gerente || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={branch.estado_activo ? 'success' : 'error'}>
                      {branch.estado_activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(branch.created_at)}</TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedBranch(branch)
                          setShowEditModal(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedBranch(branch)
                          setShowDeactivateModal(true)
                        }}
                      >
                        {branch.estado_activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        title="Editar Sucursal"
        size="lg"
      >
        {selectedBranch && (
          <EditBranchForm
            branch={selectedBranch}
            onSuccess={() => {
              setShowEditModal(false)
              setSelectedBranch(null)
              setMessage({ type: 'success', text: 'Sucursal actualizada correctamente' })
            }}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedBranch(null)
            }}
          />
        )}
      </Modal>

      {/* Deactivate/Reactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onOpenChange={setShowDeactivateModal}
        title={selectedBranch?.estado_activo ? 'Desactivar Sucursal' : 'Reactivar Sucursal'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedBranch?.estado_activo
              ? `¿Estás seguro de que deseas desactivar la sucursal "${selectedBranch?.nombre}"? Los usuarios asignados ya no podrán seleccionarla.`
              : `¿Estás seguro de que deseas reactivar la sucursal "${selectedBranch?.nombre}"?`}
          </p>
          <ModalFooter>
            <Button variant="secondary" onPress={() => setShowDeactivateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant={selectedBranch?.estado_activo ? 'danger' : 'primary'}
              onPress={handleDeactivate}
              isLoading={isLoading}
            >
              {selectedBranch?.estado_activo ? 'Desactivar' : 'Reactivar'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
