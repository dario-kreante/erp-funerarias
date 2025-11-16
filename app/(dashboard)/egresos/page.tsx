import { getExpenses, getExpenseStats } from '@/lib/actions/expenses'
import { getServicesForSelect } from '@/lib/actions/services-lookup'
import { ExpensesClient } from '@/components/expenses/ExpensesClient'

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const tab = (searchParams.tab as string) || 'all'
  const filters = {
    status: tab !== 'all' ? tab : undefined,
    category: searchParams.category as string | undefined,
    date_from: searchParams.date_from as string | undefined,
    date_to: searchParams.date_to as string | undefined,
  }

  const [expenses, services, stats] = await Promise.all([
    getExpenses(filters),
    getServicesForSelect(),
    getExpenseStats(),
  ])

  return (
    <ExpensesClient
      expenses={expenses as any}
      services={services}
      stats={stats}
      tab={tab}
      filters={{
        category: filters.category,
        date_from: filters.date_from,
        date_to: filters.date_to,
      }}
    />
  )
}
