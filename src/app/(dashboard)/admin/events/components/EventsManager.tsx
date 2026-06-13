'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EventStatus } from '@prisma/client'
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { createEventAction, deleteEventAction, updateEventAction } from '@/features/events/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type CalendarEvent = {
  id: string
  programId: string | null
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
  status: EventStatus
  program: {
    id: string
    name: string
  } | null
}

type CalendarProgram = {
  id: string
  name: string
  department?: {
    name: string
  } | null
}

type ModalMode = 'view' | 'create' | 'edit'
type CalendarFilter = 'UPCOMING' | 'COMPLETED'

const statusOptions: { value: EventStatus; label: string; tone: React.ComponentProps<typeof Badge>['tone'] }[] = [
  { value: 'UPCOMING', label: 'Upcoming', tone: 'warning' },
  { value: 'COMPLETED', label: 'Completed', tone: 'success' },
]

const calendarFilterOptions = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
]

const calendarStatusOptions = statusOptions.map((option) => ({
  value: option.value,
  label: option.label,
}))

const displayDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function getStatusMeta(status: EventStatus) {
  return statusOptions.find((item) => item.value === status) ?? statusOptions[0]
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDateRange(start: string, end: string) {
  const startLabel = displayDateFormatter.format(new Date(start))
  const endLabel = displayDateFormatter.format(new Date(end))
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

export function EventsManager({
  initialEvents,
  programs,
}: {
  initialEvents: CalendarEvent[]
  programs: CalendarProgram[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<ModalMode>('view')
  const [filter, setFilter] = useState<CalendarFilter>('UPCOMING')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  )

  const stats = useMemo(
    () => ({
      upcoming: events.filter((event) => event.status !== 'COMPLETED' && event.status !== 'CANCELLED').length,
      completed: events.filter((event) => event.status === 'COMPLETED').length,
    }),
    [events],
  )

  const filteredEvents = useMemo(
    () =>
      events
        .filter((event) => event.status !== 'CANCELLED')
        .filter((event) =>
          filter === 'COMPLETED'
            ? event.status === 'COMPLETED'
            : event.status !== 'COMPLETED',
        )
        .sort((first, second) => {
          if (first.status === 'COMPLETED' && second.status !== 'COMPLETED') return 1
          if (first.status !== 'COMPLETED' && second.status === 'COMPLETED') return -1
          return new Date(first.startDate).getTime() - new Date(second.startDate).getTime()
        }),
    [events, filter],
  )

  const isModalOpen = mode === 'create' || selectedEvent !== null
  const isFormMode = mode === 'create' || mode === 'edit'

  function openView(eventId: string) {
    setSelectedId(eventId)
    setMode('view')
    setMessage(null)
  }

  function openCreate() {
    setSelectedId(null)
    setMode('create')
    setMessage(null)
  }

  function closeModal() {
    setSelectedId(null)
    setMode('view')
    setMessage(null)
  }

  function updateLocalStatus(eventId: string, status: EventStatus) {
    setEvents((current) =>
      current.map((event) => (event.id === eventId ? { ...event, status } : event)),
    )
  }

  function handleStatusChange(eventId: string, status: EventStatus) {
    const previous = events.find((event) => event.id === eventId)?.status
    if (previous === 'COMPLETED' && status !== 'COMPLETED') {
      setMessage('Agenda completed sudah dikunci dan tidak bisa diubah statusnya.')
      return
    }
    updateLocalStatus(eventId, status)
    setMessage(null)

    startTransition(async () => {
      const result = await updateEventAction(eventId, { status })
      if (result.error) {
        if (previous) updateLocalStatus(eventId, previous)
        setMessage(result.error)
        return
      }
      if (status === 'CANCELLED') {
        setEvents((current) => current.filter((event) => event.id !== eventId))
      }
      router.refresh()
    })
  }

  function handleDelete() {
    if (!selectedEvent) return
    const confirmed = window.confirm('Hapus agenda ini dari kalender?')
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteEventAction(selectedEvent.id)
      if (result.error) {
        setMessage(result.error)
        return
      }
      setEvents((current) => current.filter((event) => event.id !== selectedEvent.id))
      closeModal()
      router.refresh()
    })
  }

  function handleSubmit(formData: FormData) {
    const programId = String(formData.get('programId') ?? '')
    const title = String(formData.get('title') ?? '')
    const description = String(formData.get('description') ?? '')
    const location = String(formData.get('location') ?? '')
    const startDate = new Date(String(formData.get('startDate') ?? ''))
    const endDate = new Date(String(formData.get('endDate') ?? ''))
    const status =
      selectedEvent?.status === 'COMPLETED'
        ? 'COMPLETED'
        : (String(formData.get('status') ?? 'UPCOMING') as EventStatus)

    setMessage(null)
    startTransition(async () => {
      const payload = { programId, title, description, location, startDate, endDate }
      const result =
        mode === 'create'
          ? await createEventAction(payload)
          : selectedEvent
            ? await updateEventAction(selectedEvent.id, { ...payload, status })
            : { error: 'Agenda tidak ditemukan.' }

      if (result.error) {
        setMessage(result.error)
        return
      }

      const program = programs.find((item) => item.id === programId) ?? null
      if (mode === 'create' && result.event) {
        setEvents((current) => [
          ...current,
          {
            id: result.event.id,
            programId,
            title,
            description,
            location,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'UPCOMING',
            program: program ? { id: program.id, name: program.name } : null,
          },
        ])
      }

      if (mode === 'edit' && selectedEvent) {
        setEvents((current) =>
          current.map((event) =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  programId,
                  title,
                  description,
                  location,
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  status,
                  program: program ? { id: program.id, name: program.name } : null,
                }
              : event,
          ),
        )
      }

      closeModal()
      router.refresh()
    })
  }

  const modalTitle =
    mode === 'create' ? 'Tambah Agenda' : mode === 'edit' ? 'Edit Agenda' : 'Detail Agenda'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Kalender Kegiatan"
          description="Kelola jadwal kegiatan, status event, dan tanggal pelaksanaan."
        />
        <Button
          onClick={openCreate}
          className="h-11 w-11 shrink-0 px-0 sm:w-auto sm:px-5"
          aria-label="Tambah agenda baru"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Agenda Baru</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={CalendarDays}
          label="Upcoming"
          value={stats.upcoming}
          description="Belum selesai"
          toneClassName="bg-warning-surface text-warning-foreground"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          description="Sudah selesai"
          toneClassName="bg-success-surface text-success-foreground"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Semua Agenda</p>
            <h2 className="font-heading text-xl font-bold text-primary">
              {filter === 'COMPLETED' ? 'Agenda completed' : 'Agenda upcoming'}
            </h2>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:flex">
            <ListboxSelect
              aria-label="Filter status kalender"
              value={filter}
              options={calendarFilterOptions}
              onValueChange={(nextValue) => setFilter(nextValue as CalendarFilter)}
              className="sm:w-48"
            />
            <Badge tone="surface">{filteredEvents.length} agenda</Badge>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title={filter === 'COMPLETED' ? 'Belum ada agenda completed' : 'Belum ada agenda upcoming'}
              description={
                filter === 'COMPLETED'
                  ? 'Agenda yang sudah selesai akan tampil di filter ini.'
                  : 'Agenda completed disembunyikan dari daftar ini. Gunakan filter untuk melihatnya.'
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredEvents.map((event) => {
              const status = getStatusMeta(event.status)
              return (
                <Card
                  key={event.id}
                  className="transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <CardContent className="p-0">
                    <div
                      onClick={() => openView(event.id)}
                      className="block w-full cursor-pointer p-4 text-left sm:p-5"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-xs font-bold uppercase tracking-wide text-accent">
                            {event.program?.name ?? 'Tanpa Program'}
                          </p>
                          <h3 className="line-clamp-2 font-heading text-lg font-extrabold leading-tight text-primary">
                            {event.title}
                          </h3>
                        </div>
                        <Badge tone={status.tone} className="shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">
                        {event.description}
                      </p>
                      <div className="mt-4 grid gap-2 text-sm font-semibold text-primary sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex min-w-0 flex-wrap gap-3">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                            <span className="truncate">{formatDateRange(event.startDate, event.endDate)}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        </div>
                        <div
                          className="sm:w-40"
                          onClick={(clickEvent) => clickEvent.stopPropagation()}
                        >
                          <ListboxSelect
                            aria-label={`Ubah status ${event.title}`}
                            value={event.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING'}
                            options={calendarStatusOptions}
                            disabled={isPending || event.status === 'COMPLETED'}
                            onValueChange={(nextValue) => handleStatusChange(event.id, nextValue as EventStatus)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-float ring-1 ring-border sm:max-w-3xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/95 p-5 backdrop-blur">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                  Kalender Kegiatan
                </p>
                <h3 id="event-modal-title" className="font-heading text-xl font-extrabold text-primary">
                  {modalTitle}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Tutup modal">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="p-5 sm:p-6">
              {message ? (
                <div className="mb-4 rounded-2xl bg-danger-surface px-4 py-3 text-sm font-semibold text-danger-foreground">
                  {message}
                </div>
              ) : null}

              {isFormMode ? (
                <form action={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="programId" className="text-sm font-semibold text-primary">
                        Program Terkait
                      </label>
                      <ListboxSelect
                        id="programId"
                        name="programId"
                        defaultValue={selectedEvent?.programId ?? programs[0]?.id ?? ''}
                        options={
                          programs.length === 0
                            ? [{ value: '', label: 'Belum ada program tersedia' }]
                            : programs.map((program) => ({
                                value: program.id,
                                label: program.department?.name ? `${program.department.name} - ${program.name}` : program.name,
                              }))
                        }
                        disabled={isPending || programs.length === 0}
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="title" className="text-sm font-semibold text-primary">
                        Judul Kegiatan
                      </label>
                      <Input id="title" name="title" required defaultValue={selectedEvent?.title ?? ''} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="startDate" className="text-sm font-semibold text-primary">
                        Tanggal Mulai
                      </label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="text"
                        required
                        placeholder="YYYY-MM-DDTHH:mm"
                        defaultValue={selectedEvent ? toDateTimeLocal(selectedEvent.startDate) : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endDate" className="text-sm font-semibold text-primary">
                        Tanggal Selesai
                      </label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="text"
                        required
                        placeholder="YYYY-MM-DDTHH:mm"
                        defaultValue={selectedEvent ? toDateTimeLocal(selectedEvent.endDate) : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-semibold text-primary">
                        Lokasi
                      </label>
                      <Input id="location" name="location" required defaultValue={selectedEvent?.location ?? ''} />
                    </div>

                    {mode === 'edit' ? (
                      <div className="space-y-2">
                        <label htmlFor="status" className="text-sm font-semibold text-primary">
                          Status
                        </label>
                        <ListboxSelect
                          id="status"
                          name="status"
                          value={selectedEvent?.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING'}
                          options={calendarStatusOptions}
                          disabled={selectedEvent?.status === 'COMPLETED'}
                          onValueChange={(nextValue) => {
                            if (selectedEvent) {
                              handleStatusChange(selectedEvent.id, nextValue as EventStatus)
                            }
                          }}
                        />
                        {selectedEvent?.status === 'COMPLETED' ? (
                          <p className="text-xs font-semibold text-text-secondary">
                            Status completed sudah dikunci.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="description" className="text-sm font-semibold text-primary">
                        Deskripsi
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        required
                        rows={5}
                        defaultValue={selectedEvent?.description ?? ''}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    {mode === 'edit' ? (
                      <Button type="button" variant="danger" onClick={handleDelete} disabled={isPending}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={() => (selectedEvent ? setMode('view') : closeModal())}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isPending || programs.length === 0}>
                      {isPending ? 'Menyimpan...' : 'Simpan Agenda'}
                    </Button>
                  </div>
                </form>
              ) : selectedEvent ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Badge tone={getStatusMeta(selectedEvent.status).tone} className="mb-3">
                        {getStatusMeta(selectedEvent.status).label}
                      </Badge>
                      <h4 className="font-heading text-2xl font-extrabold leading-tight text-primary">
                        {selectedEvent.title}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-accent">
                        {selectedEvent.program?.name ?? 'Tanpa Program'}
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => setMode('edit')}>
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile icon={CalendarDays} label="Pelaksanaan" value={formatDateRange(selectedEvent.startDate, selectedEvent.endDate)} />
                    <InfoTile icon={MapPin} label="Lokasi" value={selectedEvent.location} />
                    <div className="space-y-2 rounded-2xl bg-surface-alt p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Status</p>
                      <ListboxSelect
                        value={selectedEvent.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING'}
                        options={calendarStatusOptions}
                        disabled={isPending || selectedEvent.status === 'COMPLETED'}
                        onValueChange={(nextValue) => handleStatusChange(selectedEvent.id, nextValue as EventStatus)}
                      />
                      {selectedEvent.status === 'COMPLETED' ? (
                        <p className="text-xs font-semibold text-text-secondary">
                          Status completed sudah dikunci.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-alt p-4">
                    <p className="mb-2 text-sm font-bold text-primary">Deskripsi Kegiatan</p>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-w-0">
      <h1 className="font-heading text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  toneClassName,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: number
  description: string
  toneClassName: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-3 sm:p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11', toneClassName)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden={true} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-text-secondary sm:text-xs">{label}</p>
          <div className="font-heading text-2xl font-extrabold leading-none text-primary sm:text-3xl">{value}</div>
          <p className="mt-1 text-xs text-text-secondary">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl bg-surface-alt p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden={true} />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="break-words text-sm font-bold text-primary">{value}</p>
      </div>
    </div>
  )
}
