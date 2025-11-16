'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cx } from '@/lib/utils/cx'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { TransactionModal } from './TransactionModal'
import { deleteTransaction, updateTransaction } from '@/lib/actions/transactions'
import { Plus, Edit02, Trash01, CheckCircle } from '@untitledui/icons'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
  nombre_responsable: string
  total_final: number
}

interface Transaction {
  id: string
  service_id: string
  numero_transaccion: string
  fecha_transaccion: string
  monto: number
  moneda: string
  metodo_pago: string
  cuenta_destino: string | null
  estado: string
  observaciones: string | null
  service?: {
    id: string
    numero_servicio: string
    nombre_fallecido: string
    nombre_responsable: string
    total_final: number
  }
}

interface Stats {
  totalPagado: number
  totalPendiente: number
  pagosMes: number
  cantidadTransacciones: number
  cantidadPagadas: number
  cantidadPendientes: number
  byMethod: Record<string, number>
}

interface TransactionsClientProps {
  transactions: Transaction[]
  services: Service[]
  stats: Stats
  filters: {
    status?: string
    payment_method?: string
    date_from?: string
    date_to?: string
  }
}

const statusColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  pagado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  reembolsado: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
  reembolsado: 'Reembolsado',
}

const methodLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  cheque: 'Cheque',
  seguro: 'Seguro',
  cuota_mortuoria: 'Cuota Mortuoria',
}

export function TransactionsClient({
  transactions,
  services,
  stats,
  filters,
}: TransactionsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta transacción?')) return

    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteTransaction(id)
      } catch (error) {
        alert('Error al eliminar la transacción')
      } finally {
        setDeletingId(null)
      }
    })
  }

  const handleMarkPaid = async (transaction: Transaction) => {
    if (transaction.estado === 'pagado') return

    startTransition(async () => {
      try {
        await updateTransaction(transaction.id, { estado: 'pagado' })
      } catch (error) {
        alert('Error al actualizar el estado')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de pagos y cobros de servicios
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Nueva Transacción
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Total Recaudado</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(stats.totalPagado)}
          </p>
          <p className="text-xs text-gray-400">{stats.cantidadPagadas} transacciones</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Pendiente de Cobro</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {formatCurrency(stats.totalPendiente)}
          </p>
          <p className="text-xs text-gray-400">{stats.cantidadPendientes} transacciones</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Recaudación Mes</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {formatCurrency(stats.pagosMes)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Total Transacciones</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.cantidadTransacciones}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="rechazado">Rechazado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
              Método de Pago
            </label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue={filters.payment_method}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="cheque">Cheque</option>
              <option value="seguro">Seguro</option>
              <option value="cuota_mortuoria">Cuota Mortuoria</option>
            </select>
          </div>
          <div>
            <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <input
              type="date"
              id="date_from"
              name="date_from"
              defaultValue={filters.date_from}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="date_to" className="block text-sm font-medium text-gray-700">
              Hasta
            </label>
            <input
              type="date"
              id="date_to"
              name="date_to"
              defaultValue={filters.date_to}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Transacción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Servicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {transaction.numero_transaccion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.service ? (
                      <div>
                        <div className="font-medium">{transaction.service.numero_servicio}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.service.nombre_fallecido}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(new Date(transaction.fecha_transaccion))}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.monto)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {methodLabels[transaction.metodo_pago] || transaction.metodo_pago}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        statusColors[transaction.estado] || statusColors.pendiente
                      )}
                    >
                      {statusLabels[transaction.estado] || transaction.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {transaction.estado === 'pendiente' && (
                        <button
                          onClick={() => handleMarkPaid(transaction)}
                          className="text-green-600 hover:text-green-900"
                          title="Marcar como pagado"
                          disabled={isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit02 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                        disabled={deletingId === transaction.id}
                      >
                        <Trash01 className="h-4 w-4" />
                      </button>
                      {transaction.service_id && (
                        <Link
                          href={`/servicios/${transaction.service_id}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay transacciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        services={services}
        transaction={editingTransaction || undefined}
      />
    </div>
  )
}
