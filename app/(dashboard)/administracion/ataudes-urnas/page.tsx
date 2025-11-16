import { getCoffinUrns } from '@/lib/actions/coffin-urns'
import { CoffinUrnsClient } from './coffin-urns-client'

export default async function CoffinUrnsPage() {
  const coffinUrns = await getCoffinUrns()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ataúdes y Urnas</h1>
      </div>
      <CoffinUrnsClient initialData={coffinUrns} />
    </div>
  )
}
