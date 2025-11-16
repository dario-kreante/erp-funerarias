import { getTransactions, getTransactionStats } from '@/lib/actions/transactions'
import { getServicesForSelect } from '@/lib/actions/services-lookup'
import { TransactionsClient } from '@/components/transactions/TransactionsClient'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    status: searchParams.status as string | undefined,
    payment_method: searchParams.payment_method as string | undefined,
    date_from: searchParams.date_from as string | undefined,
    date_to: searchParams.date_to as string | undefined,
  }

  const [transactions, services, stats] = await Promise.all([
    getTransactions(filters),
    getServicesForSelect(),
    getTransactionStats(),
  ])

  return (
    <TransactionsClient
      transactions={transactions as any}
      services={services}
      stats={stats}
      filters={filters}
    />
  )
}
