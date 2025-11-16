import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserBranches, getUserProfile } from '@/lib/actions/branches'
import { getCatalogData } from '@/lib/actions/services'
import { ServiceForm } from '@/components/services/ServiceForm'
import { ArrowLeft as ArrowLeftIcon } from '@untitledui/icons'

export default async function NewServicePage() {
  const [profile, branches, catalogData] = await Promise.all([
    getUserProfile(),
    getUserBranches(),
    getCatalogData(),
  ])

  if (!profile) {
    redirect('/login')
  }

  if (!branches || branches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Sin sucursales asignadas</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No tienes sucursales asignadas. Contacta al administrador para poder crear servicios.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formattedBranches = branches.map((b) => ({
    id: b.id,
    nombre: b.nombre,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/servicios"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Volver a Servicios
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Servicio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete los datos del servicio funerario. Los campos marcados con * son obligatorios.
        </p>
      </div>

      <ServiceForm
        funeralHomeId={profile.funeral_home_id}
        branches={formattedBranches}
        catalogData={catalogData}
      />
    </div>
  )
}
