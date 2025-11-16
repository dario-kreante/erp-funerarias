import { getMortuaryQuota } from '@/lib/actions/mortuary-quotas'
import { QuotaDetails } from './_components/QuotaDetails'
import { QuotaEditForm } from './_components/QuotaEditForm'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface MortuaryQuotaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MortuaryQuotaDetailPage({ params }: MortuaryQuotaDetailPageProps) {
  const { id } = await params
  const quota = await getMortuaryQuota(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/cuotas-mortuorias"
            className="text-sm text-primary-600 hover:underline"
          >
            &larr; Volver a cuotas mortuorias
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Detalle de Cuota Mortuoria</h1>
          <p className="mt-1 text-sm text-gray-500">
            Servicio: {quota.service?.numero_servicio} - {quota.service?.nombre_fallecido}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuotaDetails quota={quota} />
        <QuotaEditForm quota={quota} />
      </div>
    </div>
  )
}
