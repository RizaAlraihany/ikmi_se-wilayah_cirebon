import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { agendaQueries } from '@/features/agendas/queries'
import {
  agendaStatusLabel,
  agendaStatusTone,
  agendaVisibilityLabel,
  deriveAgendaStatus,
  formatJakartaDatetimeLocal,
  scheduleTypeLabel,
} from '@/features/agendas/domain'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgendaForm } from '../components/agenda-form'
import { AgendaArchiveButton } from '../components/agenda-archive-button'

function formatDatetime(value: Date | null) {
  if (!value) return 'Belum ditentukan'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(value)
}

export default async function AgendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [agenda, options] = await Promise.all([
    agendaQueries.getAgendaById(id),
    agendaQueries.getFormOptions(),
  ])
  if (!agenda) notFound()

  const derivedStatus = deriveAgendaStatus(agenda)
  const statusLabel = agendaStatusLabel(derivedStatus)
  const statusTone = agendaStatusTone(derivedStatus)
  const isArchived = agenda.status === 'ARCHIVED'

  return (
    <div className="space-y-6">
      <ButtonLink href="/admin/agendas" prefetch={false} variant="ghost" className="w-fit px-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Agenda
      </ButtonLink>

      {/* Hero header */}
      <div className="flex flex-col gap-4 border-y border-border bg-surface px-1 py-6 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Agenda organisasi
          </p>
          <h1 className="mt-2 break-words font-heading text-3xl font-extrabold text-primary">{agenda.name}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {agenda.organizationalUnit?.name ?? 'Tanpa unit'} ·{' '}
            {agenda.period?.name ?? 'Tanpa periode'}
          </p>
        </div>
        <Badge tone={statusTone} className="w-fit">
          {statusLabel}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        {/* Left column — info + edit form */}
        <div className="min-w-0 space-y-6">
          {/* Detail card */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {agenda.description && (
                <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                  {agenda.description}
                </p>
              )}

              <dl className="grid gap-4 sm:grid-cols-2">
                <DataItem
                  label="Tipe jadwal"
                  value={scheduleTypeLabel(agenda.scheduleType)}
                  icon={<CalendarDays className="h-4 w-4 text-accent" />}
                />
                <DataItem
                  label="Visibilitas"
                  value={agendaVisibilityLabel(agenda.visibility)}
                />
                <DataItem
                  label="Mulai"
                  value={formatDatetime(agenda.startDatetime)}
                  icon={<Clock className="h-4 w-4 text-accent" />}
                />
                <DataItem
                  label="Selesai"
                  value={formatDatetime(agenda.endDatetime)}
                  icon={<Clock className="h-4 w-4 text-accent" />}
                />
                {agenda.location && (
                  <DataItem
                    label="Lokasi"
                    value={agenda.location}
                    icon={<MapPin className="h-4 w-4 text-accent" />}
                  />
                )}
                {agenda.pic && (
                  <DataItem
                    label="PIC"
                    value={agenda.pic.fullName}
                    icon={<Users className="h-4 w-4 text-accent" />}
                  />
                )}
                {agenda.program && (
                  <DataItem label="Program terkait" value={agenda.program.name} />
                )}
                {agenda.relativeToProgram && (
                  <DataItem
                    label="Program pemicu"
                    value={`${agenda.relativeToProgram.name}${agenda.relativeOffset !== null ? ` (+${agenda.relativeOffset} hari)` : ''}`}
                  />
                )}
                {agenda.conditionalNote && (
                  <div className="sm:col-span-2">
                    <DataItem label="Catatan kondisi" value={agenda.conditionalNote} />
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Badge tone="surface">{scheduleTypeLabel(agenda.scheduleType)}</Badge>
                {agenda.requiresRegistration && (
                  <Badge tone="surface">Memerlukan pendaftaran</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit form */}
          {!isArchived && (
            <AgendaForm
              {...options}
              agenda={{
                id: agenda.id,
                name: agenda.name,
                organizationalUnitId: agenda.organizationalUnitId,
                periodId: agenda.periodId,
                description: agenda.description,
                picId: agenda.picId,
                programId: agenda.programId,
                scheduleType: agenda.scheduleType,
                startDatetime: formatJakartaDatetimeLocal(agenda.startDatetime),
                endDatetime: formatJakartaDatetimeLocal(agenda.endDatetime),
                recurrenceRule: agenda.recurrenceRule,
                relativeToProgramId: agenda.relativeToProgramId,
                relativeOffset: agenda.relativeOffset,
                conditionalNote: agenda.conditionalNote,
                location: agenda.location,
                visibility: agenda.visibility,
                status: agenda.status,
                requiresRegistration: agenda.requiresRegistration,
                registrationType: agenda.registrationType,
              }}
            />
          )}
        </div>

        {/* Right column — actions */}
        <div className="min-w-0 space-y-6">
          <AgendaArchiveButton id={agenda.id} isArchived={isArchived} />
        </div>
      </div>
    </div>
  )
}

function DataItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-1 flex min-w-0 items-center gap-1.5 break-words text-sm leading-6 text-primary">
        {icon}
        {value}
      </dd>
    </div>
  )
}
