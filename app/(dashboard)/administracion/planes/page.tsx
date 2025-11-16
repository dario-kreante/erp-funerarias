import { getPlans } from '@/lib/actions/plans'
import { PlansClient } from './plans-client'

export default async function PlansPage() {
  const plans = await getPlans()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
      </div>
      <PlansClient initialData={plans} />
    </div>
  )
}
