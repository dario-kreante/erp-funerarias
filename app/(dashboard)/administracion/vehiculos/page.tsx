import { getVehicles } from '@/lib/actions/vehicles'
import { VehiclesClient } from './vehicles-client'

export default async function VehiclesPage() {
  const vehicles = await getVehicles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
      </div>
      <VehiclesClient initialData={vehicles} />
    </div>
  )
}
