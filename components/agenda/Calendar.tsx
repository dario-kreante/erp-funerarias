'use client'

import { useCallback, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { cx } from '@/lib/utils/cx'
import type { EventType } from '@/types/database'

// Setup Spanish localization
const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
})

// Spanish messages for the calendar
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (total: number) => `+ Ver ${total} más`,
}

// Event type colors
const eventTypeColors: Record<EventType, string> = {
  velatorio: '#8B5CF6', // Purple
  ceremonia: '#3B82F6', // Blue
  cremacion: '#EF4444', // Red
  inhumacion: '#DC2626', // Red darker
  recogida: '#F97316', // Orange
  reunion: '#10B981', // Green
  mantenimiento: '#6B7280', // Gray
  otro: '#6366F1', // Indigo
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: {
    tipo_evento: EventType
    color?: string
    estado: string
    service_id?: string
    descripcion?: string
  }
}

interface AgendaCalendarProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: SlotInfo) => void
  onRangeChange?: (range: { start: Date; end: Date }) => void
  onViewChange?: (view: View) => void
  defaultView?: View
  date?: Date
  onNavigate?: (date: Date) => void
  selectable?: boolean
  className?: string
  height?: string | number
}

export function AgendaCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
  onRangeChange,
  onViewChange,
  defaultView = Views.MONTH,
  date,
  onNavigate,
  selectable = true,
  className,
  height = 'calc(100vh - 250px)',
}: AgendaCalendarProps) {
  // Custom event styling
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = event.resource?.color || eventTypeColors[event.resource?.tipo_evento || 'otro']
    const isCompleted = event.resource?.estado === 'completado'
    const isCancelled = event.resource?.estado === 'cancelado'

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: isCancelled ? 0.5 : isCompleted ? 0.8 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
        textDecoration: isCancelled ? 'line-through' : 'none',
      },
    }
  }, [])

  // Custom day cell styling
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date()
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    return {
      style: {
        backgroundColor: isToday ? '#EFF6FF' : undefined, // Light blue for today
      },
    }
  }, [])

  // Handle range change for data fetching
  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      if (Array.isArray(range)) {
        // Week or day view - array of dates
        const start = range[0]
        const end = range[range.length - 1]
        onRangeChange?.({ start, end })
      } else {
        // Month view - object with start and end
        onRangeChange?.(range)
      }
    },
    [onRangeChange]
  )

  // Memoize formats
  const formats = useMemo(
    () => ({
      dateFormat: 'd',
      dayFormat: 'EEE d',
      monthHeaderFormat: 'MMMM yyyy',
      dayHeaderFormat: 'EEEE d MMMM',
      dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`,
      agendaDateFormat: 'EEE d MMM',
      agendaTimeFormat: 'HH:mm',
      agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, 'HH:mm', { locale: es })} - ${format(end, 'HH:mm', { locale: es })}`,
    }),
    []
  )

  return (
    <div className={cx('bg-white rounded-lg shadow-sm', className)}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor="allDay"
        style={{ height }}
        messages={messages}
        formats={formats}
        culture="es"
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        defaultView={defaultView}
        date={date}
        onNavigate={onNavigate}
        selectable={selectable}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        onRangeChange={handleRangeChange}
        onView={onViewChange}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        popup
        popupOffset={30}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 6, 0, 0)} // 6 AM
        max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
      />
    </div>
  )
}

// Event type badge component
export function EventTypeBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    velatorio: 'Velatorio',
    ceremonia: 'Ceremonia',
    cremacion: 'Cremación',
    inhumacion: 'Inhumación',
    recogida: 'Recogida',
    reunion: 'Reunión',
    mantenimiento: 'Mantenimiento',
    otro: 'Otro',
  }

  const color = eventTypeColors[type]

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {labels[type]}
    </span>
  )
}

// Event status badge
export function EventStatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    programado: 'bg-blue-100 text-blue-800',
    en_progreso: 'bg-yellow-100 text-yellow-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    programado: 'Programado',
    en_progreso: 'En progreso',
    completado: 'Completado',
    cancelado: 'Cancelado',
  }

  return (
    <span className={cx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[status])}>
      {statusLabels[status] || status}
    </span>
  )
}
