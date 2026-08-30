import Link from 'next/link'
import { CalendarDays, MapPin, Plus, Repeat2 } from 'lucide-react'
import { agendaQueries } from '@/features/agendas/queries'
import {
  agendaStatusLabel,
  agendaStatusTone,
  agendaVisibilityLabel,
  deriveAgendaStatus,
  scheduleTypeLabel,
} from '@/features/agendas/domain'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

function formatSchedule(agenda: {
  scheduleType: string
  startDatetime: Date | null
  recurrenceRule: string | null
  relativeOffset: number | null
}) {
  if (agenda.scheduleType === 'FIXED_DATE') {
    return agenda.startDatetime
      ? new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Jakarta',
        }).format(agenda.startDatetime)
      : 'Tanggal belum ditentukan'
  }
  if (agenda.scheduleType === 'RECURRING') {
    return agenda.recurrenceRule ? `Berulang · ${agenda.recurrenceRule}` : 'Aturan berulang belum diatur'
  }
  if (agenda.scheduleType === 'RELATIVE_TO_PROGRAM') {
    const offset = agenda.relativeOffset ?? 0
    return `Setelah Program ${offset >= 0 ? '+' : ''}${offset} hari`
  }
  if (agenda.scheduleType === 'DEPENDENT_ON_PROGRAM') return 'Mengikuti realisasi Program'
  return 'Menunggu kondisi terpenuhi'
}

export default async function AgendaListPage() {
  const agendas = await agendaQueries.getAgendas()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Agenda</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            Kelola jadwal tetap, berulang, kondisional, relatif, dan dependen secara terpisah dari Program.
          </p>
        </div>
        <ButtonLink href="/admin/agendas/new" prefetch={false}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agenda Baru
        </ButtonLink>
      </div>

      {agendas.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada Agenda"
          description="Buat Agenda pertama untuk unit organisasi Anda."
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border bg-surface">
          {agendas.map((agenda) => {
            const derivedStatus = deriveAgendaStatus(agenda)
            return (
              <li key={agenda.id}>
                <Link
                  href={`/admin/agendas/${agenda.id}`}
                  prefetch={false}
                  className="grid min-h-28 gap-4 px-1 py-5 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">
                        {agenda.organizationalUnit?.name ?? 'Unit belum ditentukan'}
                      </p>
                      <Badge tone={agendaStatusTone(derivedStatus)}>{agendaStatusLabel(derivedStatus)}</Badge>
                    </div>
                    <h2 className="mt-2 break-words font-heading text-lg font-bold text-primary">{agenda.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        {agenda.scheduleType === 'RECURRING'
                          ? <Repeat2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                          : <CalendarDays className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
                        {formatSchedule(agenda)}
                      </span>
                      {agenda.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />{agenda.location}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-secondary md:max-w-72 md:justify-end">
                    <span>{scheduleTypeLabel(agenda.scheduleType)}</span>
                    <span>{agendaVisibilityLabel(agenda.visibility)}</span>
                    {agenda.period?.name ? <span>{agenda.period.name}</span> : null}
                    {agenda.program ? <span className="text-accent">{agenda.program.name}</span> : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
