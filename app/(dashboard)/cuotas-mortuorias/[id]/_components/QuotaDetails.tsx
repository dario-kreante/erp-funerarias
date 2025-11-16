'use client'

import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRut } from '@/lib/utils/rut'
import type { MortuaryQuota } from '@/types/database'

interface QuotaDetailsProps {
  quota: MortuaryQuota & {
    service?: {
      id: string
      numero_servicio: string
      nombre_fallecido: string
      rut_fallecido: string | null
      nombre_responsable: string
      rut_responsable: string
      telefono_responsable: string
      email_responsable: string | null
    }
    documents?: any[]
  }
}

export function QuotaDetails({ quota }: QuotaDetailsProps) {
  const statusLabels: Record<string, string> = {
    no_iniciada: 'No Iniciada',
    en_preparacion: 'En Preparación',
    ingresada: 'Ingresada',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    pagada: 'Pagada',
  }

  const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    no_iniciada: 'default',
    en_preparacion: 'warning',
    ingresada: 'info',
    aprobada: 'success',
    rechazada: 'error',
    pagada: 'success',
  }

  const entityLabels: Record<string, string> = {
    afp: 'AFP',
    ips: 'IPS',
    pgu: 'PGU',
    otra: 'Otra',
  }

  const payerLabels: Record<string, string> = {
    familia: 'Familia',
    funeraria: 'Funeraria',
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Estado Actual</h3>
        <div className="mt-4">
          <Badge variant={statusColors[quota.estado]} size="lg">
            {statusLabels[quota.estado]}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {quota.fecha_solicitud && (
            <p className="text-sm">
              <span className="font-medium text-gray-500">Fecha Solicitud:</span>{' '}
              {formatDate(quota.fecha_solicitud)}
            </p>
          )}
          {quota.fecha_resolucion && (
            <p className="text-sm">
              <span className="font-medium text-gray-500">Fecha Resolución:</span>{' '}
              {formatDate(quota.fecha_resolucion)}
            </p>
          )}
          {quota.fecha_pago && (
            <p className="text-sm">
              <span className="font-medium text-gray-500">Fecha Pago:</span>{' '}
              {formatDate(quota.fecha_pago)}
            </p>
          )}
        </div>
      </div>

      {/* Service Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Información del Servicio</h3>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Fallecido</dt>
            <dd className="mt-1 text-sm text-gray-900">{quota.service?.nombre_fallecido}</dd>
          </div>
          {quota.service?.rut_fallecido && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">RUT Fallecido</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatRut(quota.service.rut_fallecido)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Responsable</dt>
            <dd className="mt-1 text-sm text-gray-900">{quota.service?.nombre_responsable}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">RUT Responsable</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {quota.service?.rut_responsable && formatRut(quota.service.rut_responsable)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">{quota.service?.telefono_responsable}</dd>
          </div>
          {quota.service?.email_responsable && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{quota.service.email_responsable}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Quota Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Información de la Cuota</h3>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Aplica Cuota</dt>
            <dd className="mt-1 text-sm text-gray-900">{quota.aplica ? 'Sí' : 'No'}</dd>
          </div>
          {quota.entidad && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Entidad</dt>
              <dd className="mt-1 text-sm text-gray-900">{entityLabels[quota.entidad]}</dd>
            </div>
          )}
          {quota.nombre_entidad && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Nombre Entidad</dt>
              <dd className="mt-1 text-sm text-gray-900">{quota.nombre_entidad}</dd>
            </div>
          )}
          {quota.monto_facturado && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Monto Facturado</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {formatCurrency(quota.monto_facturado)}
              </dd>
            </div>
          )}
          {quota.pagador && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Pagador</dt>
              <dd className="mt-1 text-sm text-gray-900">{payerLabels[quota.pagador]}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Documents */}
      {quota.documents && quota.documents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
          <ul className="mt-4 divide-y divide-gray-200">
            {quota.documents.map((doc: any) => (
              <li key={doc.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.nombre_archivo}</p>
                  <p className="text-xs text-gray-500">{doc.document_type}</p>
                </div>
                <a
                  href={doc.url_archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
