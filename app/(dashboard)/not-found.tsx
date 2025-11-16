import Link from 'next/link'
import { SearchRefraction, ArrowLeft } from '@untitledui/icons'

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <SearchRefraction className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Recurso no encontrado
        </h1>

        <p className="mb-8 text-sm text-gray-600">
          El servicio, transacción o recurso que buscas no existe o no tienes acceso a él.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Ir al dashboard
          </Link>

          <Link
            href="/servicios"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ver servicios
          </Link>
        </div>
      </div>
    </div>
  )
}
