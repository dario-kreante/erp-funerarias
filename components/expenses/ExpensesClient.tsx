'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cx } from '@/lib/utils/cx'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { ExpenseModal } from './ExpenseModal'
import { deleteExpense } from '@/lib/actions/expenses'
import { Plus, Edit02, Trash01, File01, Upload01 } from '@untitledui/icons'

interface Service {
  id: string
  numero_servicio: string
  nombre_fallecido: string
}

interface Expense {
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
  service?: {
    id: string
    numero_servicio: string
    nombre_fallecido: string
  }
  supplier?: {
    id: string
    nombre: string
  }
}

interface Stats {
  totalEgresos: number
  egresosMes: number
  cantidadEgresos: number
  sinFactura: number
  pendienteFactura: number
  byCategory: Record<string, number>
}

interface ExpensesClientProps {
  expenses: Expense[]
  services: Service[]
  stats: Stats
  tab: string
  filters: {
    category?: string
    date_from?: string
    date_to?: string
  }
}

const statusColors: Record<string, string> = {
  con_factura: 'bg-green-100 text-green-800',
  pendiente_factura: 'bg-yellow-100 text-yellow-800',
  sin_factura: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  con_factura: 'Con Factura',
  pendiente_factura: 'Pendiente',
  sin_factura: 'Sin Factura',
}

const categoryLabels: Record<string, string> = {
  insumos: 'Insumos',
  servicios_externos: 'Servicios Externos',
  combustible: 'Combustible',
  mantenimiento: 'Mantenimiento',
  servicios_publicos: 'Servicios Públicos',
  arriendos: 'Arriendos',
  honorarios: 'Honorarios',
  impuestos: 'Impuestos',
  seguros: 'Seguros',
  otros: 'Otros',
}

export function ExpensesClient({ expenses, services, stats, tab, filters }: ExpensesClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingExpense(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este egreso?')) return

    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteExpense(id)
      } catch (error) {
        alert('Error al eliminar el egreso')
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egresos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control de gastos y pagos a proveedores
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Agregar Egreso
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'inline-flex items-center rounded-md border px-3 py-2 text-sm font-semibold shadow-sm',
              showFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Total Egresos</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {formatCurrency(stats.totalEgresos)}
          </p>
          <p className="text-xs text-gray-400">{stats.cantidadEgresos} registros</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Egresos del Mes</p>
          <p className="mt-1 text-2xl font-semibold text-orange-600">
            {formatCurrency(stats.egresosMes)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Sin Factura</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{stats.sinFactura}</p>
          <p className="text-xs text-gray-400">Requieren atención</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Pendientes Factura</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {stats.pendienteFactura}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/egresos?tab=all"
            className={cx(
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
              tab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Todos
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs">
              {stats.cantidadEgresos}
            </span>
          </Link>
          <Link
            href="/egresos?tab=con_factura"
            className={cx(
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
              tab === 'con_factura'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Con Factura
          </Link>
          <Link
            href="/egresos?tab=pendiente_factura"
            className={cx(
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
              tab === 'pendiente_factura'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Pendiente Factura
            {stats.pendienteFactura > 0 && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                {stats.pendienteFactura}
              </span>
            )}
          </Link>
          <Link
            href="/egresos?tab=sin_factura"
            className={cx(
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
              tab === 'sin_factura'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Sin Factura
            {stats.sinFactura > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                {stats.sinFactura}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg bg-white p-4 shadow">
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select
                id="category"
                name="category"
                defaultValue={filters.category}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todas</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                Aplicar Filtros
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 text-sm font-medium text-gray-900">Desglose por Categoría</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="rounded bg-gray-50 p-2">
                  <p className="text-xs font-medium text-gray-500">
                    {categoryLabels[category] || category}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Concepto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Factura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Servicio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatDate(new Date(expense.fecha_egreso))}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {expense.supplier?.nombre || expense.nombre_proveedor || '-'}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900">
                    {expense.concepto}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {expense.categoria ? categoryLabels[expense.categoria] || expense.categoria : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(expense.monto)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          statusColors[expense.estado] || statusColors.sin_factura
                        )}
                      >
                        {statusLabels[expense.estado] || expense.estado}
                      </span>
                      {expense.numero_factura && (
                        <span className="text-xs text-gray-500">{expense.numero_factura}</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {expense.service ? (
                      <Link
                        href={`/servicios/${expense.service.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expense.service.numero_servicio}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit02 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                        disabled={deletingId === expense.id}
                      >
                        <Trash01 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay egresos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        services={services}
        expense={editingExpense || undefined}
      />
    </div>
  )
}
