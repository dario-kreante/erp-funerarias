import { getCurrentUserProfile } from '@/lib/actions/users'
import { ProfileForm } from './_components/ProfileForm'
import { PasswordChangeForm } from './_components/PasswordChangeForm'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/date'

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile()

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    ejecutivo: 'Ejecutivo',
    operaciones: 'Operaciones',
    caja: 'Caja',
    colaborador: 'Colaborador',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Profile Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
            {profile.nombre_completo
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{profile.nombre_completo}</h2>
            <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant={profile.estado_activo ? 'success' : 'error'}>
                {profile.estado_activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="primary">{roleLabels[profile.role] || profile.role}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Funeraria</p>
            <p className="mt-1 text-sm text-gray-900">
              {profile.funeral_home?.nombre_fantasia || profile.funeral_home?.razon_social}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sucursales</p>
            <p className="mt-1 text-sm text-gray-900">
              {profile.user_branches?.length > 0
                ? profile.user_branches.map((ub: any) => ub.branch?.nombre).join(', ')
                : 'Sin asignar'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Miembro desde
            </p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
        <p className="mt-1 text-sm text-gray-500">Actualiza tu nombre y avatar</p>
        <div className="mt-4">
          <ProfileForm
            defaultValues={{
              nombre_completo: profile.nombre_completo,
              url_avatar: profile.url_avatar || '',
            }}
          />
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
        <p className="mt-1 text-sm text-gray-500">
          Asegúrate de usar una contraseña segura que no uses en otros sitios
        </p>
        <div className="mt-4">
          <PasswordChangeForm />
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Información de la Cuenta</h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">ID de Usuario</span>
            <span className="text-sm font-mono text-gray-900">{profile.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Último acceso</span>
            <span className="text-sm text-gray-900">
              {profile.auth_user.last_sign_in_at
                ? formatDate(profile.auth_user.last_sign_in_at)
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Email confirmado</span>
            <span className="text-sm text-gray-900">
              {profile.auth_user.email_confirmed_at ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
