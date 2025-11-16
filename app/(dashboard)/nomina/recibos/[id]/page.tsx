import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPaymentReceipt } from '@/lib/actions/payroll'
import { cx } from '@/lib/utils/cx'
import { formatCurrency, formatDate, formatRut } from '@/lib/utils'

export default async function PaymentReceiptPage({
  params,
}: {
  params: { id: string }
}) {
  const receipt = await getPaymentReceipt(params.id).catch(() => null)

  if (!receipt) {
    notFound()
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/nomina/recibos" className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Recibo {receipt.numero_recibo}</h1>
          <span
            className={cx(
              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
              statusColors[receipt.estado] || statusColors.pendiente
            )}
          >
            {statusLabels[receipt.estado] || receipt.estado}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className={cx(
            'inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white',
            'shadow-sm hover:bg-blue-500 print:hidden'
          )}
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir
        </button>
      </div>

      {/* Receipt Content - Printable */}
      <div className="rounded-lg bg-white p-8 shadow print:shadow-none">
        {/* Receipt Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">RECIBO DE PAGO</h2>
              <p className="mt-1 text-sm text-gray-500">N° {receipt.numero_recibo}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Fecha de Emisión</p>
              <p className="font-semibold text-gray-900">{formatDate(receipt.fecha_emision)}</p>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div className="mb-8 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Información del Colaborador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre Completo</p>
              <p className="font-medium text-gray-900">{receipt.colaborador_nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">RUT</p>
              <p className="font-medium text-gray-900">{formatRut(receipt.colaborador_rut)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="font-medium text-gray-900">{receipt.periodo_nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium text-gray-900">{receipt.metodo_pago || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Detalle de Pago</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm text-gray-700">Sueldo Base</td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(receipt.sueldo_base)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Extras por Servicios</td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(receipt.extras)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Bonos</td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(receipt.bonos)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Comisiones</td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(receipt.comisiones)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-3 text-sm font-semibold text-gray-900">TOTAL BRUTO</td>
                <td className="py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(receipt.total_bruto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Deducciones</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm text-gray-700">Descuentos</td>
                <td className="py-3 text-right text-sm font-medium text-red-600">
                  -{formatCurrency(receipt.descuentos)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Adelantos</td>
                <td className="py-3 text-right text-sm font-medium text-red-600">
                  -{formatCurrency(receipt.adelantos)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-3 text-sm font-semibold text-gray-900">TOTAL DEDUCCIONES</td>
                <td className="py-3 text-right text-sm font-semibold text-red-600">
                  -{formatCurrency(receipt.total_deducciones)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Total */}
        <div className="rounded-lg bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">TOTAL NETO A PAGAR</span>
            <span className="text-2xl font-bold text-green-600">{formatCurrency(receipt.total_neto)}</span>
          </div>
        </div>

        {/* Verification Code */}
        {receipt.codigo_verificacion && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">Código de Verificación</p>
              <p className="font-mono text-sm text-gray-700">{receipt.codigo_verificacion}</p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="mb-2 border-t border-gray-400"></div>
            <p className="text-sm text-gray-700">Firma del Empleador</p>
          </div>
          <div className="text-center">
            <div className="mb-2 border-t border-gray-400"></div>
            <p className="text-sm text-gray-700">Firma del Colaborador</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Este documento es un comprobante de pago. Consérvelo para sus registros.</p>
          {receipt.fecha_pago && <p className="mt-1">Fecha de Pago: {formatDate(receipt.fecha_pago)}</p>}
        </div>
      </div>

      {/* Notes */}
      {receipt.notas && (
        <div className="rounded-lg bg-white p-6 shadow print:hidden">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Notas</h3>
          <p className="text-sm text-gray-700">{receipt.notas}</p>
        </div>
      )}
    </div>
  )
}
