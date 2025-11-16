'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw01, Home01 } from '@untitledui/icons'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-900">
          Ha ocurrido un error
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Lo sentimos, algo salió mal. Por favor intenta nuevamente o regresa al inicio.
        </p>

        {error.digest && (
          <p className="mb-4 text-center text-xs text-gray-400">
            Código de error: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            variant="primary"
            className="w-full"
          >
            <RefreshCw01 className="mr-2 h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </Button>

          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="secondary"
            className="w-full"
          >
            <Home01 className="mr-2 h-4 w-4" aria-hidden="true" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
