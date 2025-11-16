'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { formatCurrency } from '@/lib/utils/currency'
import { updateMortuaryQuotaStatus } from '@/lib/actions/mortuary-quotas'
import { exportToCSV, exportToExcel, exportToPDF, formatters } from '@/lib/utils/export'
import type { MortuaryQuota, MortuaryQuotaStatus } from '@/types/database'

interface QuotasTableProps {
  quotas: (MortuaryQuota & {
    service?: {
      id: string
      numero_servicio: string
      nombre_fallecido: string
      nombre_responsable: string
    }
  })[]
}

export function QuotasTable({ quotas }: QuotasTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [selectedQuota, setSelectedQuota] = useState<QuotasTableProps['quotas'][0] | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<MortuaryQuotaStatus>('no_iniciada')
  const [resolutionDate, setResolutionDate] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const statusLabels: Record<string, string> = {
    no_iniciada: 'No Iniciada',
    en_preparacion: 'En Preparación',
    ingresada: 'Ingresada',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    pagada: 'Pagada',
  }

  const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    no_iniciada: 'default',
    en_preparacion: 'warning',
    ingresada: 'info',
    aprobada: 'success',
    rechazada: 'error',
    pagada: 'success',
  }

  const entityLabels: Record<string, string> = {
    afp: 'AFP',
    ips: 'IPS',
    pgu: 'PGU',
    otra: 'Otra',
  }

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'no_iniciada', label: 'No Iniciada' },
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'ingresada', label: 'Ingresada' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'pagada', label: 'Pagada' },
  ]

  const entityOptions = [
    { value: '', label: 'Todas las entidades' },
    { value: 'afp', label: 'AFP' },
    { value: 'ips', label: 'IPS' },
    { value: 'pgu', label: 'PGU' },
    { value: 'otra', label: 'Otra' },
  ]

  const nextStatusOptions = [
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'ingresada', label: 'Ingresada' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'pagada', label: 'Pagada' },
  ]

  const filteredQuotas = quotas.filter((quota) => {
    const matchesSearch =
      quota.service?.nombre_fallecido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.service?.numero_servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.nombre_entidad?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || quota.estado === statusFilter
    const matchesEntity = !entityFilter || quota.entidad === entityFilter
    return matchesSearch && matchesStatus && matchesEntity
  })

  const handleStatusChange = async () => {
    if (!selectedQuota) return
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await updateMortuaryQuotaStatus({
        quota_id: selectedQuota.id,
        estado: newStatus,
        fecha_resolucion: resolutionDate || undefined,
        fecha_pago: paymentDate || undefined,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Estado actualizado correctamente' })
        setShowStatusModal(false)
        setSelectedQuota(null)
        setResolutionDate('')
        setPaymentDate('')
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el estado' })
    } finally {
      setIsLoading(false)
    }
  }

  const exportColumns = [
    {
      key: 'service',
      header: 'N° Servicio',
      width: 100,
      format: (value: unknown) => (value as any)?.numero_servicio || '',
    },
    {
      key: 'service',
      header: 'Fallecido',
      width: 150,
      format: (value: unknown) => (value as any)?.nombre_fallecido || '',
    },
    {
      key: 'entidad',
      header: 'Entidad',
      width: 80,
      format: (value: unknown) => entityLabels[String(value)] || String(value || ''),
    },
    { key: 'nombre_entidad', header: 'Nombre Entidad', width: 120 },
    {
      key: 'monto_facturado',
      header: 'Monto',
      width: 100,
      format: formatters.currency,
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 100,
      format: (value: unknown) => statusLabels[String(value)] || String(value),
    },
    {
      key: 'fecha_solicitud',
      header: 'Fecha Solicitud',
      width: 120,
      format: formatters.date,
    },
    {
      key: 'fecha_pago',
      header: 'Fecha Pago',
      width: 120,
      format: formatters.date,
    },
  ]

  const handleExportCSV = () => {
    exportToCSV(
      filteredQuotas,
      exportColumns,
      `cuotas_mortuorias_${new Date().toISOString().split('T')[0]}`
    )
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredQuotas,
      exportColumns,
      `cuotas_mortuorias_${new Date().toISOString().split('T')[0]}`,
      'Cuotas Mortuorias'
    )
  }

  const handleExportPDF = () => {
    exportToPDF(filteredQuotas, exportColumns, {
      title: 'Listado de Cuotas Mortuorias',
      subtitle: `Total: ${filteredQuotas.length} cuotas`,
      orientation: 'landscape',
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
            placeholder="Buscar por servicio, fallecido o entidad..."
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
        <div className="w-full sm:w-48">
          <Select
            options={entityOptions}
            selectedKey={entityFilter}
            onSelectionChange={(key) => setEntityFilter(String(key))}
            placeholder="Filtrar por entidad"
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
              <TableHead>Servicio</TableHead>
              <TableHead>Fallecido</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead align="right">Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotas.length === 0 ? (
              <EmptyTableState message="No se encontraron cuotas mortuorias" />
            ) : (
              filteredQuotas.map((quota) => (
                <TableRow key={quota.id}>
                  <TableCell>
                    <Link
                      href={`/servicios/${quota.service?.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {quota.service?.numero_servicio}
                    </Link>
                  </TableCell>
                  <TableCell>{quota.service?.nombre_fallecido}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {quota.entidad ? entityLabels[quota.entidad] : '-'}
                      </p>
                      {quota.nombre_entidad && (
                        <p className="text-xs text-gray-500">{quota.nombre_entidad}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {quota.monto_facturado ? formatCurrency(quota.monto_facturado) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[quota.estado]}>
                      {statusLabels[quota.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {quota.fecha_solicitud && (
                        <p>
                          <span className="text-gray-500">Solicitud:</span>{' '}
                          {formatDate(quota.fecha_solicitud)}
                        </p>
                      )}
                      {quota.fecha_resolucion && (
                        <p>
                          <span className="text-gray-500">Resolución:</span>{' '}
                          {formatDate(quota.fecha_resolucion)}
                        </p>
                      )}
                      {quota.fecha_pago && (
                        <p>
                          <span className="text-gray-500">Pago:</span>{' '}
                          {formatDate(quota.fecha_pago)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/cuotas-mortuorias/${quota.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedQuota(quota)
                          setNewStatus(quota.estado)
                          setShowStatusModal(true)
                        }}
                      >
                        Cambiar Estado
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onOpenChange={setShowStatusModal}
        title="Actualizar Estado de Cuota"
        description={
          selectedQuota
            ? `Servicio: ${selectedQuota.service?.numero_servicio} - ${selectedQuota.service?.nombre_fallecido}`
            : ''
        }
      >
        <div className="space-y-4">
          <Select
            label="Nuevo Estado"
            options={nextStatusOptions}
            selectedKey={newStatus}
            onSelectionChange={(key) => setNewStatus(key as MortuaryQuotaStatus)}
          />

          {(newStatus === 'aprobada' || newStatus === 'rechazada') && (
            <Input
              label="Fecha de Resolución"
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
            />
          )}

          {newStatus === 'pagada' && (
            <Input
              label="Fecha de Pago"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          )}

          <ModalFooter>
            <Button variant="secondary" onPress={() => setShowStatusModal(false)}>
              Cancelar
            </Button>
            <Button onPress={handleStatusChange} isLoading={isLoading}>
              Actualizar Estado
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
