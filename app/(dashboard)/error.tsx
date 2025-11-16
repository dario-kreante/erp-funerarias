'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw01, ArrowLeft } from '@untitledui/icons'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold text-gray-900">
          Error al cargar la página
        </h1>

        <p className="mb-6 text-center text-sm text-gray-600">
          No pudimos cargar el contenido solicitado. Esto puede ser un problema temporal.
        </p>

        {error.digest && (
          <p className="mb-4 text-center text-xs text-gray-400">
            Referencia: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            variant="primary"
            className="w-full"
          >
            <RefreshCw01 className="mr-2 h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>

          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Volver atrás
          </Button>
        </div>
      </div>
    </div>
  )
}
