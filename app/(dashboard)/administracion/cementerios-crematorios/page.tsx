import { getCemeteryCrematoriums } from '@/lib/actions/cemetery-crematoriums'
import { CemeteryCrematoriumsClient } from './cemetery-crematoriums-client'

export default async function CemeteryCrematoriumsPage() {
  const items = await getCemeteryCrematoriums()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cementerios y Crematorios</h1>
      </div>
      <CemeteryCrematoriumsClient initialData={items} />
    </div>
  )
}
