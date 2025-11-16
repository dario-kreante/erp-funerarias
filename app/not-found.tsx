import Link from 'next/link'
import { SearchRefraction, Home01, ArrowLeft } from '@untitledui/icons'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <SearchRefraction className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-2 text-6xl font-bold text-gray-900">404</h1>

        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Página no encontrada
        </h2>

        <p className="mb-8 text-gray-600">
          La página que buscas no existe o ha sido movida.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Home01 className="h-4 w-4" aria-hidden="true" />
            Ir al inicio
          </Link>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Página principal
          </Link>
        </div>
      </div>
    </div>
  )
}
