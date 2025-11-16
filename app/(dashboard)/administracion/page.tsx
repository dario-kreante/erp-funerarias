import Link from 'next/link'
import { cx } from '@/lib/utils/cx'

const adminLinks = [
  { name: 'Colaboradores', href: '/administracion/colaboradores' },
  { name: 'Planes', href: '/administracion/planes' },
  { name: 'Ataúdes y Urnas', href: '/administracion/ataudes-urnas' },
  { name: 'Cementerios', href: '/administracion/cementerios' },
  { name: 'Vehículos', href: '/administracion/vehiculos' },
  { name: 'Proveedores', href: '/administracion/proveedores' },
  { name: 'Usuarios', href: '/administracion/usuarios' },
  { name: 'Configuración Funeraria', href: '/administracion/funeraria' },
]

export default function AdministrationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cx(
              "rounded-lg border border-gray-200 bg-white p-6 shadow-sm",
              "hover:shadow-md transition-shadow"
            )}
          >
            <h3 className="text-lg font-semibold text-gray-900">{link.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}

