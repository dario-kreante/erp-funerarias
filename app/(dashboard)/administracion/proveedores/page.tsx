import { getSuppliers } from '@/lib/actions/suppliers'
import { SuppliersClient } from './suppliers-client'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
      </div>
      <SuppliersClient initialData={suppliers} />
    </div>
  )
}
