import { getExpenses } from '@/lib/actions/expenses'
import Link from 'next/link'
import { cx } from '@/lib/utils/cx'

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const tab = (searchParams.tab as string) || 'all'
  const filters = {
    status: tab !== 'all' ? tab : undefined,
    category: searchParams.category as string | undefined,
    date_from: searchParams.date_from as string | undefined,
    date_to: searchParams.date_to as string | undefined,
  }

  const expenses = await getExpenses(filters)

  const statusColors: Record<string, string> = {
    con_factura: 'bg-green-100 text-green-800',
    pendiente_factura: 'bg-yellow-100 text-yellow-800',
    sin_factura: 'bg-red-100 text-red-800',
  }

  const expensesWithoutInvoice = expenses?.filter((e: any) => e.status === 'sin_factura').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egresos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gasto sin factura: {expensesWithoutInvoice}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={cx(
              "inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white",
              "shadow-sm hover:bg-blue-500"
            )}
          >
            Agregar egreso
          </button>
          <button
            className={cx(
              "inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700",
              "shadow-sm hover:bg-gray-50"
            )}
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/egresos?tab=all"
            className={cx(
              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
              tab === 'all'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Todos
          </Link>
          <Link
            href="/egresos?tab=con_factura"
            className={cx(
              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
              tab === 'con_factura'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Facturas recibidas
          </Link>
          <Link
            href="/egresos?tab=sin_factura"
            className={cx(
              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
              tab === 'sin_factura'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            Gastos sin factura
          </Link>
        </nav>
      </div>

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
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Servicio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expenses && expenses.length > 0 ? (
              expenses.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {new Date(expense.expense_date).toLocaleDateString('es-CL')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {expense.supplier?.name || expense.supplier_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.concept}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ${parseFloat(expense.amount || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        statusColors[expense.status] || statusColors.sin_factura
                      )}
                    >
                      {expense.status === 'con_factura' && 'Con factura'}
                      {expense.status === 'pendiente_factura' && 'Pendiente de factura'}
                      {expense.status === 'sin_factura' && 'Sin factura'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {expense.service ? (
                      <Link
                        href={`/servicios/${expense.service.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expense.service.service_number}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay egresos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

