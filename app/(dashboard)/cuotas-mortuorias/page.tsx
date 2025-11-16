import { getMortuaryQuotas, getMortuaryQuotaStats } from '@/lib/actions/mortuary-quotas'
import { QuotasTable } from './_components/QuotasTable'
import { QuotaStats } from './_components/QuotaStats'
import { formatCurrency } from '@/lib/utils/currency'

export default async function MortuaryQuotasPage() {
  const [quotas, stats] = await Promise.all([getMortuaryQuotas(), getMortuaryQuotaStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cuotas Mortuorias</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona el proceso de solicitud y cobro de cuotas mortuorias (AFP, IPS, PGU)
        </p>
      </div>

      <QuotaStats stats={stats} />

      <QuotasTable quotas={quotas || []} />
    </div>
  )
}
