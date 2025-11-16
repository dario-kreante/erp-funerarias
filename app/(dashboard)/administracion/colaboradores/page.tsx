import { getCollaborators } from '@/lib/actions/collaborators'
import { CollaboratorsClient } from './collaborators-client'

export default async function CollaboratorsPage() {
  const collaborators = await getCollaborators()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
      </div>
      <CollaboratorsClient initialData={collaborators} />
    </div>
  )
}
