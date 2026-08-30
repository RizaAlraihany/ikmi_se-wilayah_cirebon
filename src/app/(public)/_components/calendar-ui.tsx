'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  calendarDateKey,
  calendarMonthUrl,
  jakartaDateParts,
  type CalendarEvent,
} from '@/features/public/calendar-domain'

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventDot(type: 'program' | 'agenda') {
  return type === 'program' ? 'bg-accent' : 'bg-primary'
}

function eventStatusLabel(event: CalendarEvent) {
  if (event.status === 'POSTPONED') return 'Ditunda'
  if (event.status === 'CANCELLED') return 'Dibatalkan'
  return null
}

export function CalendarFilters({ selectedType }: { selectedType: 'all' | 'program' | 'agenda' }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setType(type: 'all' | 'program' | 'agenda') {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') params.delete('type')
    else params.set('type', type)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1" aria-label="Filter kegiatan kalender">
      {([
        ['all', 'Semua'],
        ['program', 'Program'],
        ['agenda', 'Agenda'],
      ] as const).map(([type, label]) => (
        <button
          key={type}
          type="button"
          aria-pressed={selectedType === type}
          onClick={() => setType(type)}
          className={`min-h-11 rounded-md px-3 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selectedType === type ? 'ikmi-liquid-blue' : 'text-text-secondary hover:bg-surface-alt'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Desktop — Full Month Calendar
// ---------------------------------------------------------------------------

export function DesktopCalendarGrid({
  year,
  month,
  days,
  eventsByDate,
  today,
  selectedType,
}: {
  year: number
  month: number
  days: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  today: string
  selectedType: 'all' | 'program' | 'agenda'
}) {
  const router = useRouter()
  const prev = calendarMonthUrl(year, month, -1, selectedType)
  const next = calendarMonthUrl(year, month, 1, selectedType)

  return (
    <div className="rounded-3xl bg-surface shadow-soft ring-1 ring-border">
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => router.push(prev)}
          className="flex h-11 w-11 items-center justify-center rounded-md transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h2 className="font-heading text-xl font-extrabold text-primary">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => router.push(next)}
          className="flex h-11 w-11 items-center justify-center rounded-md transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-text-muted">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dateStr = calendarDateKey(day)
          const parts = jakartaDateParts(day)
          const isCurrentMonth = parts.month === month
          const isToday = dateStr === today
          const events = eventsByDate.get(dateStr) ?? []
          const hasEvents = events.length > 0

          return (
            <div
              key={dateStr + idx}
              className={[
                'group relative min-h-[88px] border-b border-r border-border p-2',
                idx % 7 === 6 ? 'border-r-0' : '',
                // last row — remove bottom border
                idx >= days.length - 7 ? 'border-b-0' : '',
                !isCurrentMonth ? 'bg-surface-alt/40' : '',
              ].join(' ')}
            >
              {/* Day number */}
              <span
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold',
                  isToday ? 'bg-primary text-surface' : '',
                  !isCurrentMonth ? 'text-text-muted' : 'text-primary',
                ].join(' ')}
              >
                {parts.day}
              </span>

              {/* Event items */}
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 3).map((event) => (
                  <EventChip key={event.id} event={event} />
                ))}
                {events.length > 3 && (
                  <span className="block text-[10px] font-semibold text-text-muted">
                    +{events.length - 3} lainnya
                  </span>
                )}
              </div>

              {/* Empty day dot for accessibility */}
              {!hasEvents && isCurrentMonth && (
                <span className="sr-only">Tidak ada kegiatan</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventChip({ event }: { event: CalendarEvent }) {
  const dot = eventDot(event.type)
  const status = eventStatusLabel(event)
  const inner = (
    <span
      className={[
        'flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-primary',
        'bg-primary/5 hover:bg-primary/10 transition',
      ].join(' ')}
      title={event.name}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <span className={event.status === 'CANCELLED' ? 'truncate line-through' : 'truncate'}>{event.name}</span>
      {status ? <span className="shrink-0 text-[9px] font-extrabold uppercase text-danger">{status}</span> : null}
    </span>
  )

  if (event.type === 'program' && event.slug) {
    return <Link href={`/program/${event.slug}`}>{inner}</Link>
  }
  if (event.type === 'agenda' && event.slug) {
    return <Link href={`/agenda/${event.slug}`}>{inner}</Link>
  }
  return inner
}

// ---------------------------------------------------------------------------
// Mobile — Compact Month + Selected Date List
// ---------------------------------------------------------------------------

export function MobileCalendar({
  year,
  month,
  days,
  eventsByDate,
  today,
  selectedDate,
  selectedType,
}: {
  year: number
  month: number
  days: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  today: string
  selectedDate: string
  selectedType: 'all' | 'program' | 'agenda'
}) {
  const router = useRouter()
  const prev = calendarMonthUrl(year, month, -1, selectedType)
  const next = calendarMonthUrl(year, month, 1, selectedType)

  const selectedEvents = eventsByDate.get(selectedDate) ?? []
  const selectedDateLabel = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(selectedDate + 'T00:00:00+07:00'))

  function selectDate(dateStr: string) {
    const params = new URLSearchParams(window.location.search)
    params.set('date', dateStr)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-soft ring-1 ring-border">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => router.push(prev)}
          className="flex h-11 w-11 items-center justify-center rounded-md transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h2 className="font-heading text-lg font-extrabold text-primary">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => router.push(next)}
          className="flex h-11 w-11 items-center justify-center rounded-md transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Compact month grid */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-text-muted">
              {day}
            </div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateStr = calendarDateKey(day)
            const parts = jakartaDateParts(day)
            const isCurrentMonth = parts.month === month
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const hasEvents = (eventsByDate.get(dateStr)?.length ?? 0) > 0
            const events = eventsByDate.get(dateStr) ?? []

            return (
              <button
                type="button"
                key={dateStr + idx}
                aria-label={`${parts.day} ${MONTH_NAMES[parts.month]} ${parts.year}${events.length ? `, ${events.length} kegiatan` : ', tidak ada kegiatan'}`}
                aria-pressed={isSelected}
                onClick={() => isCurrentMonth && selectDate(dateStr)}
                disabled={!isCurrentMonth}
                className={[
                  'relative flex min-h-11 flex-col items-center gap-0.5 py-2 text-sm font-bold transition',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                  isCurrentMonth ? 'text-primary' : 'text-text-muted opacity-40',
                  isSelected || isToday ? 'ikmi-liquid-blue' : 'hover:bg-primary/5',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    isToday || isSelected ? 'text-surface' : '',
                  ].join(' ')}
                >
                  {parts.day}
                </span>
                {/* Event dots */}
                {hasEvents && isCurrentMonth && (
                  <span className="flex gap-0.5">
                    {events.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`h-1 w-1 rounded-full ${eventDot(e.type)}`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date event list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-primary">{selectedDateLabel}</h3>
        </div>

        {selectedEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <MobileEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface p-4 text-sm text-text-secondary ring-1 ring-border">
            Tidak ada kegiatan pada tanggal ini.
          </p>
        )}
      </div>
    </div>
  )
}

function MobileEventCard({ event }: { event: CalendarEvent }) {
  const dot = eventDot(event.type)
  const typeLabel = event.type === 'program' ? 'Program' : 'Agenda'
  const status = eventStatusLabel(event)

  const inner = (
    <div className="flex items-start gap-3 rounded-xl bg-surface p-4 shadow-soft ring-1 ring-border">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={event.status === 'CANCELLED' ? 'font-semibold text-primary line-through' : 'font-semibold text-primary'}>{event.name}</p>
          {status ? <span className="text-[10px] font-extrabold uppercase tracking-wide text-danger">{status}</span> : null}
        </div>
        <p className="mt-0.5 text-xs text-text-secondary">
          {typeLabel}
          {event.unitName ? ` · ${event.unitName}` : ''}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
    </div>
  )

  if (event.type === 'program' && event.slug) {
    return <Link href={`/program/${event.slug}`}>{inner}</Link>
  }
  if (event.type === 'agenda' && event.slug) {
    return <Link href={`/agenda/${event.slug}`}>{inner}</Link>
  }
  return inner
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        Program
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        Agenda
      </span>
    </div>
  )
}
