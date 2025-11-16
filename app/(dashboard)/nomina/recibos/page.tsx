import Link from 'next/link'
import { getPaymentReceipts } from '@/lib/actions/payroll'
import { cx } from '@/lib/utils/cx'
import { formatCurrency, formatDate, formatRut } from '@/lib/utils'

export default async function PaymentReceiptsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const receipts = await getPaymentReceipts()

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    generado: 'Generado',
    enviado: 'Enviado',
    pagado: 'Pagado',
  }

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    generado: 'bg-blue-100 text-blue-800',
    enviado: 'bg-purple-100 text-purple-800',
    pagado: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recibos de Pago</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Recibos</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{receipts?.length || 0}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Generados</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {receipts?.filter((r) => r.estado === 'generado').length || 0}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Pagados</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {receipts?.filter((r) => r.estado === 'pagado').length || 0}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-500">Total Pagado</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(
              receipts?.filter((r) => r.estado === 'pagado').reduce((sum, r) => sum + r.total_neto, 0) || 0
            )}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                N° Recibo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Colaborador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha Emisión
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Neto
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
            {receipts && receipts.length > 0 ? (
              receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {receipt.numero_recibo}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {receipt.colaborador_nombre}
                    <div className="text-xs text-gray-500">{formatRut(receipt.colaborador_rut)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {receipt.periodo_nombre}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(receipt.fecha_emision)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(receipt.total_neto)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cx(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        statusColors[receipt.estado] || statusColors.pendiente
                      )}
                    >
                      {statusLabels[receipt.estado] || receipt.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/nomina/recibos/${receipt.id}`} className="text-blue-600 hover:text-blue-900">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay recibos de pago generados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
