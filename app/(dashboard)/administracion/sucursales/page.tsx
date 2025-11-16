import { getBranches } from '@/lib/actions/branches'
import { BranchesTable } from './_components/BranchesTable'
import { CreateBranchModal } from './_components/CreateBranchModal'

export default async function BranchesPage() {
  const branches = await getBranches()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra las sucursales de tu funeraria
          </p>
        </div>
        <CreateBranchModal />
      </div>

      <BranchesTable branches={branches || []} />
    </div>
  )
}
