import { getRevenueStats } from '@/lib/actions/revenue'
import { RevenueDashboard } from '@/components/revenue/RevenueDashboard'

export default async function VentasPage() {
  const stats = await getRevenueStats()

  return <RevenueDashboard stats={stats} />
}
