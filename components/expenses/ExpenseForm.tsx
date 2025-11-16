'use client'

import { useState, useTransition } from 'react'
import { createExpense, updateExpense } from '@/lib/actions/expenses'
import { formatCurrency } from '@/lib/utils/currency'
import { toInputDate } from '@/lib/utils/date'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
}

interface ExpenseFormProps {
  services: Service[]
  expense?: {
    id: string
    service_id: string | null
    fecha_egreso: string
    supplier_id: string | null
    nombre_proveedor: string | null
    concepto: string
    monto: number
    categoria: string | null
    info_impuestos: string | null
    numero_factura: string | null
    estado: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

const categoryOptions = [
  { value: 'insumos', label: 'Insumos' },
  { value: 'servicios_externos', label: 'Servicios Externos' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'servicios_publicos', label: 'Servicios Públicos' },
  { value: 'arriendos', label: 'Arriendos' },
  { value: 'honorarios', label: 'Honorarios' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otros', label: 'Otros' },
]

const statusOptions = [
  { value: 'con_factura', label: 'Con Factura' },
  { value: 'pendiente_factura', label: 'Pendiente de Factura' },
  { value: 'sin_factura', label: 'Sin Factura' },
]

export function ExpenseForm({ services, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    service_id: expense?.service_id || '',
    fecha_egreso: expense?.fecha_egreso
      ? toInputDate(new Date(expense.fecha_egreso))
      : toInputDate(new Date()),
    nombre_proveedor: expense?.nombre_proveedor || '',
    concepto: expense?.concepto || '',
    monto: expense?.monto || 0,
    categoria: expense?.categoria || '',
    info_impuestos: expense?.info_impuestos || '',
    numero_factura: expense?.numero_factura || '',
    estado: expense?.estado || 'sin_factura',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.concepto.trim()) {
      setError('El concepto es requerido')
      return
    }

    if (formData.monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    startTransition(async () => {
      try {
        const input = {
          service_id: formData.service_id || null,
          fecha_egreso: formData.fecha_egreso,
          supplier_id: null,
          nombre_proveedor: formData.nombre_proveedor || null,
          concepto: formData.concepto,
          monto: formData.monto,
          categoria: (formData.categoria || null) as any,
          info_impuestos: formData.info_impuestos || null,
          numero_factura: formData.numero_factura || null,
          estado: formData.estado as any,
        }

        if (expense) {
          await updateExpense(expense.id, input)
        } else {
          await createExpense(input)
        }

        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar el egreso')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha *</label>
          <input
            type="date"
            value={formData.fecha_egreso}
            onChange={(e) => setFormData({ ...formData, fecha_egreso: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Monto (CLP) *</label>
          <input
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            min="1"
            step="1"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Concepto *</label>
        <input
          type="text"
          value={formData.concepto}
          onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Descripción del gasto"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoría</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Seleccionar...</option>
            {categoryOptions.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estado Factura *</label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Proveedor</label>
        <input
          type="text"
          value={formData.nombre_proveedor}
          onChange={(e) => setFormData({ ...formData, nombre_proveedor: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Nombre del proveedor"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Número de Factura</label>
          <input
            type="text"
            value={formData.numero_factura}
            onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Ej: F-12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Info Impuestos</label>
          <input
            type="text"
            value={formData.info_impuestos}
            onChange={(e) => setFormData({ ...formData, info_impuestos: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="IVA, exento, etc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Servicio Asociado</label>
        <select
          value={formData.service_id}
          onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Sin asociar a servicio</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.numero_servicio} - {service.nombre_fallecido}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Opcional: vincule este gasto a un servicio específico
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isPending}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : expense ? 'Actualizar' : 'Crear Egreso'}
        </button>
      </div>
    </form>
  )
}
