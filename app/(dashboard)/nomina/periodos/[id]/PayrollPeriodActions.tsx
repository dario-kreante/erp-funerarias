'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  calculatePayrollForPeriod,
  approveAllRecords,
  generateAllReceipts,
  closePayrollPeriod,
} from '@/lib/actions/payroll'
import { cx } from '@/lib/utils/cx'

interface PayrollPeriodActionsProps {
  periodId: string
  periodStatus: string
}

export function PayrollPeriodActions({ periodId, periodStatus }: PayrollPeriodActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCalculate = async () => {
    setLoading('calculate')
    setMessage(null)
    try {
      const result = await calculatePayrollForPeriod(periodId)
      setMessage({
        type: 'success',
        text: `Nómina calculada: ${result.created} nuevos, ${result.updated} actualizados`,
      })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al calcular' })
    } finally {
      setLoading(null)
    }
  }

  const handleApproveAll = async () => {
    setLoading('approve')
    setMessage(null)
    try {
      const result = await approveAllRecords(periodId)
      setMessage({ type: 'success', text: `${result?.length || 0} registros aprobados` })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al aprobar' })
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateReceipts = async () => {
    setLoading('receipts')
    setMessage(null)
    try {
      const result = await generateAllReceipts(periodId)
      setMessage({
        type: 'success',
        text: `${result.generated} recibos generados, ${result.skipped} omitidos`,
      })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al generar recibos' })
    } finally {
      setLoading(null)
    }
  }

  const handleClose = async () => {
    if (!confirm('¿Está seguro de cerrar este período? Esta acción no se puede deshacer.')) {
      return
    }
    setLoading('close')
    setMessage(null)
    try {
      await closePayrollPeriod({ period_id: periodId })
      setMessage({ type: 'success', text: 'Período cerrado exitosamente' })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al cerrar' })
    } finally {
      setLoading(null)
    }
  }

  const isOpen = periodStatus === 'abierto'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isOpen && (
          <>
            <button
              onClick={handleCalculate}
              disabled={loading !== null}
              className={cx(
                'inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold',
                'bg-blue-600 text-white shadow-sm hover:bg-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading === 'calculate' ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Calculando...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Calcular Nómina
                </>
              )}
            </button>

            <button
              onClick={handleApproveAll}
              disabled={loading !== null}
              className={cx(
                'inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold',
                'bg-green-600 text-white shadow-sm hover:bg-green-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading === 'approve' ? 'Aprobando...' : 'Aprobar Todos'}
            </button>

            <button
              onClick={handleGenerateReceipts}
              disabled={loading !== null}
              className={cx(
                'inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold',
                'bg-purple-600 text-white shadow-sm hover:bg-purple-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading === 'receipts' ? 'Generando...' : 'Generar Recibos'}
            </button>

            <button
              onClick={handleClose}
              disabled={loading !== null}
              className={cx(
                'inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold',
                'bg-yellow-600 text-white shadow-sm hover:bg-yellow-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading === 'close' ? 'Cerrando...' : 'Cerrar Período'}
            </button>
          </>
        )}
      </div>

      {message && (
        <div
          className={cx(
            'rounded-md p-3 text-sm',
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
