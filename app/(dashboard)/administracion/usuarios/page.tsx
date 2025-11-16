import { getUsers } from '@/lib/actions/users'
import { getBranches } from '@/lib/actions/branches'
import { UsersTable } from './_components/UsersTable'
import { InviteUserModal } from './_components/InviteUserModal'

export default async function UsersPage() {
  const [users, branches] = await Promise.all([getUsers(), getBranches()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los usuarios de tu organización
          </p>
        </div>
        <InviteUserModal branches={branches || []} />
      </div>

      <UsersTable users={users || []} branches={branches || []} />
    </div>
  )
}
