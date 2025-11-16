import { createClient } from '@/lib/supabase/server'
import { getCalendarEvents } from '@/lib/actions/agenda'
import { AgendaClient } from './AgendaClient'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import '@/app/styles/calendar.css'

export const metadata = {
  title: 'Agenda | ERP Funerarias',
  description: 'Gestión de calendario y eventos',
}

export default async function AgendaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <p>No autenticado</p>
      </div>
    )
  }

  // Get user profile and branches
  const { data: profile } = await supabase
    .from('profiles')
    .select('funeral_home_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="p-6">
        <p>Perfil no encontrado</p>
      </div>
    )
  }

  const { data: userBranches } = await supabase
    .from('user_branches')
    .select('branch_id')
    .eq('user_id', user.id)

  const branchIds = userBranches?.map((ub) => ub.branch_id) || []

  // Get branches for filter
  let branchesQuery = supabase
    .from('branches')
    .select('*')
    .eq('funeral_home_id', profile.funeral_home_id)
    .eq('estado_activo', true)
    .order('nombre')

  if (branchIds.length > 0) {
    branchesQuery = branchesQuery.in('id', branchIds)
  }

  const { data: branches } = await branchesQuery

  // Get initial events for current month
  const now = new Date()
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(addMonths(now, 1))

  let initialEvents: Awaited<ReturnType<typeof getCalendarEvents>> = []
  try {
    initialEvents = await getCalendarEvents(startDate.toISOString(), endDate.toISOString())
  } catch (error) {
    console.error('Error loading initial events:', error)
  }

  return (
    <AgendaClient
      initialEvents={initialEvents}
      branches={branches || []}
      funeralHomeId={profile.funeral_home_id}
    />
  )
}

