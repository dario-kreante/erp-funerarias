'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { createTransaction, updateTransaction } from '@/lib/actions/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import { toInputDate } from '@/lib/utils/date'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
  nombre_responsable: string
  total_final: number
}

interface TransactionFormProps {
  services: Service[]
  transaction?: {
    id: string
    service_id: string
    fecha_transaccion: string
    monto: number
    moneda: string
    metodo_pago: string
    cuenta_destino: string | null
    estado: string
    observaciones: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'cuota_mortuoria', label: 'Cuota Mortuoria' },
]

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'reembolsado', label: 'Reembolsado' },
]

export function TransactionForm({ services, transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    service_id: transaction?.service_id || '',
    fecha_transaccion: transaction?.fecha_transaccion
      ? toInputDate(new Date(transaction.fecha_transaccion))
      : toInputDate(new Date()),
    monto: transaction?.monto || 0,
    metodo_pago: transaction?.metodo_pago || 'efectivo',
    cuenta_destino: transaction?.cuenta_destino || '',
    estado: transaction?.estado || 'pendiente',
    observaciones: transaction?.observaciones || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.service_id) {
      setError('Debe seleccionar un servicio')
      return
    }

    if (formData.monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    startTransition(async () => {
      try {
        const input = {
          service_id: formData.service_id,
          fecha_transaccion: formData.fecha_transaccion,
          monto: formData.monto,
          moneda: 'CLP',
          metodo_pago: formData.metodo_pago as any,
          cuenta_destino: formData.cuenta_destino || null,
          estado: formData.estado as any,
          observaciones: formData.observaciones || null,
        }

        if (transaction) {
          await updateTransaction(transaction.id, input)
        } else {
          await createTransaction(input)
        }

        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar la transacción')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Servicio *</label>
        <select
          value={formData.service_id}
          onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
          disabled={!!transaction}
        >
          <option value="">Seleccionar servicio...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.numero_servicio} - {service.nombre_fallecido} ({formatCurrency(service.total_final)})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha *</label>
          <input
            type="date"
            value={formData.fecha_transaccion}
            onChange={(e) => setFormData({ ...formData, fecha_transaccion: e.target.value })}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Método de Pago *</label>
          <select
            value={formData.metodo_pago}
            onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estado *</label>
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
        <label className="block text-sm font-medium text-gray-700">Cuenta Destino</label>
        <input
          type="text"
          value={formData.cuenta_destino}
          onChange={(e) => setFormData({ ...formData, cuenta_destino: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Número de cuenta o referencia"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
          placeholder="Notas adicionales..."
        />
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
          {isPending ? 'Guardando...' : transaction ? 'Actualizar' : 'Crear Transacción'}
        </button>
      </div>
    </form>
  )
}
