'use client'

import { useState, useCallback, useEffect } from 'react'
import { View, SlotInfo } from 'react-big-calendar'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { AgendaCalendar, EventDetailModal } from '@/components/agenda'
import type { CalendarEvent } from '@/components/agenda'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EventForm } from '@/components/agenda/EventForm'
import { getCalendarEvents, getAgendaEvent, getAgendaStats } from '@/lib/actions/agenda'
import { useBranch } from '@/lib/contexts/BranchContext'
import { cx } from '@/lib/utils/cx'
import type { AgendaEvent, EventType, Branch, Service, AgendaResourceBooking } from '@/types/database'
import {
  PlusIcon,
  CalendarIcon,
  FilterLinesIcon,
  RefreshCw05Icon,
  ListIcon,
  Grid01Icon,
} from '@untitledui/icons-react/outline'

interface CalendarEventData {
  id: string
  titulo: string
  fecha_inicio: string
  fecha_fin: string
  todo_el_dia: boolean
  tipo_evento: EventType
  color: string | null
  estado: string
  service_id: string | null
  descripcion: string | null
  service?: { numero_servicio: string; nombre_fallecido: string }[] | null
}

interface AgendaClientProps {
  initialEvents: CalendarEventData[]
  branches: Branch[]
  funeralHomeId: string
}

export function AgendaClient({ initialEvents, branches, funeralHomeId }: AgendaClientProps) {
  const { selectedBranch } = useBranch()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<
    (AgendaEvent & { service?: Service | null; resource_bookings?: AgendaResourceBooking[] }) | null
  >(null)
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('month')
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)
  const [stats, setStats] = useState({ eventosHoy: 0, eventosSemana: 0, eventosPendientes: 0 })

  // Filter state
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('')
  const [selectedEventType, setSelectedEventType] = useState<string>('')

  // Convert DB events to calendar format
  const convertEvents = useCallback((dbEvents: CalendarEventData[]): CalendarEvent[] => {
    return dbEvents.map((event) => ({
      id: event.id,
      title: event.titulo,
      start: new Date(event.fecha_inicio),
      end: new Date(event.fecha_fin),
      allDay: event.todo_el_dia,
      resource: {
        tipo_evento: event.tipo_evento as EventType,
        color: event.color ?? undefined,
        estado: event.estado,
        service_id: event.service_id ?? undefined,
        descripcion: event.descripcion ?? undefined,
      },
    }))
  }, [])

  // Load events
  const loadEvents = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true)
    try {
      const data = await getCalendarEvents(
        start.toISOString(),
        end.toISOString(),
        selectedBranchFilter || selectedBranch?.id
      )
      setEvents(convertEvents(data))
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [convertEvents, selectedBranchFilter, selectedBranch?.id])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await getAgendaStats(selectedBranchFilter || selectedBranch?.id)
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [selectedBranchFilter, selectedBranch?.id])

  // Initial load
  useEffect(() => {
    setEvents(convertEvents(initialEvents))
    loadStats()
  }, [initialEvents, convertEvents, loadStats])

  // Reload on filter change
  useEffect(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(addMonths(currentDate, 1))
    loadEvents(start, end)
    loadStats()
  }, [selectedBranchFilter, currentDate, loadEvents, loadStats])

  // Handle date range change
  const handleRangeChange = useCallback(
    (range: { start: Date; end: Date }) => {
      loadEvents(range.start, range.end)
    },
    [loadEvents]
  )

  // Handle event selection
  const handleSelectEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const fullEvent = await getAgendaEvent(event.id)
      setSelectedEvent(fullEvent)
      setShowEventDetail(true)
    } catch (error) {
      console.error('Error loading event details:', error)
    }
  }, [])

  // Handle slot selection (for creating new events)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSlotInfo(slotInfo)
    setShowCreateEvent(true)
  }, [])

  // Handle event update/refresh
  const handleEventUpdate = useCallback(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(addMonths(currentDate, 1))
    loadEvents(start, end)
    loadStats()
  }, [currentDate, loadEvents, loadStats])

  // Navigate calendar
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  // View change
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view)
  }, [])

  const eventTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'velatorio', label: 'Velatorio' },
    { value: 'ceremonia', label: 'Ceremonia' },
    { value: 'cremacion', label: 'Cremación' },
    { value: 'inhumacion', label: 'Inhumación' },
    { value: 'recogida', label: 'Recogida' },
    { value: 'reunion', label: 'Reunión' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otro', label: 'Otro' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona eventos, velatorios, ceremonias y recursos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onPress={() => setShowFilters(!showFilters)}
          >
            <FilterLinesIcon className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="secondary"
            onPress={handleEventUpdate}
            isDisabled={isLoading}
          >
            <RefreshCw05Icon className={cx('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
          <Button variant="primary" onPress={() => setShowCreateEvent(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Eventos hoy</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.eventosHoy}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Esta semana</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.eventosSemana}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Grid01Icon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.eventosPendientes}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ListIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Sucursal</label>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Tipo de evento</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onPress={() => {
                  setSelectedBranchFilter('')
                  setSelectedEventType('')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card className="overflow-hidden">
        <AgendaCalendar
          events={events.filter((event) => {
            if (selectedEventType && event.resource?.tipo_evento !== selectedEventType) {
              return false
            }
            return true
          })}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onRangeChange={handleRangeChange}
          onViewChange={handleViewChange}
          onNavigate={handleNavigate}
          date={currentDate}
          defaultView={currentView}
          selectable
          height="calc(100vh - 420px)"
        />
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          funeralHomeId={funeralHomeId}
          branchId={selectedBranch?.id || branches[0]?.id || ''}
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false)
            setSelectedEvent(null)
          }}
          onUpdate={handleEventUpdate}
        />
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateEvent}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateEvent(false)
            setSlotInfo(null)
          }
        }}
        title="Crear nuevo evento"
        size="lg"
      >
        <EventForm
          funeralHomeId={funeralHomeId}
          branchId={selectedBranch?.id || branches[0]?.id || ''}
          initialData={
            slotInfo
              ? {
                  fecha_inicio: slotInfo.start.toISOString().slice(0, 16),
                  fecha_fin: slotInfo.end.toISOString().slice(0, 16),
                }
              : undefined
          }
          onSuccess={() => {
            setShowCreateEvent(false)
            setSlotInfo(null)
            handleEventUpdate()
          }}
          onCancel={() => {
            setShowCreateEvent(false)
            setSlotInfo(null)
          }}
        />
      </Modal>
    </div>
  )
}
