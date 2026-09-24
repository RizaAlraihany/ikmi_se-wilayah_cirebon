import Link from 'next/link'
import { CalendarDays, MapPin, Plus, Repeat2, Search, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'UPCOMING', label: 'Akan Datang' },
  { value: 'ONGOING', label: 'Sedang Berlangsung' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
] as const

export default async function AgendaListPage({ searchParams }: { searchParams: Promise<{ period?: string; q?: string; status?: string; unit?: string }> }) {
  const params = await searchParams
  const q = params.q || ''
  const status = params.status || ''
  const unit = params.unit || ''
  const workspace = await agendaQueries.getAgendaWorkspace(params.period)

  let agendas = workspace.agendas
  if (q) {
    const query = q.toLowerCase()
    agendas = agendas.filter((agenda) => agenda.name.toLowerCase().includes(query))
  }
  if (status) {
    agendas = agendas.filter((agenda) => deriveAgendaStatus(agenda) === status)
  }
  if (unit) {
    agendas = agendas.filter((agenda) => agenda.organizationalUnitId === unit)
  }

  const hasFilters = q || status || unit

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-y-2 border-primary bg-surface px-1 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Operasional Organisasi</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Agenda</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-text-secondary">
            Kelola agenda bertanggal tetap atau kondisional. Jadwal lanjutan lama tetap tersimpan sebagai riwayat.
          </p>
        </div>
        <ButtonLink href="/admin/agendas/new" prefetch={false}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agenda Baru
        </ButtonLink>
      </div>

      <form action="/admin/agendas" className="space-y-3 border-y border-border bg-surface px-1 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <label htmlFor="period" className="shrink-0 text-sm font-semibold text-primary">Periode</label>
            <select id="period" name="period" defaultValue={workspace.selectedPeriodId ?? ''} className="h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary">
              {workspace.periods.map((period) => <option key={period.id} value={period.id}>{period.name}{period.id === workspace.activePeriodId ? ' · Aktif' : ''}</option>)}
            </select>
            <label htmlFor="search" className="shrink-0 text-sm font-semibold text-primary">Cari</label>
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input id="search" name="q" defaultValue={q} placeholder="Cari nama agenda..." className="pl-10" />
            </div>
            <label htmlFor="status" className="shrink-0 text-sm font-semibold text-primary">Status</label>
            <Select id="status" name="status" defaultValue={status} className="h-11 min-w-[180px]">
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
            <label htmlFor="unit" className="shrink-0 text-sm font-semibold text-primary">Unit</label>
            <Select id="unit" name="unit" defaultValue={unit} className="h-11 min-w-[180px]">
              <option value="">Semua Unit</option>
              {workspace.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <button type="submit" className="ikmi-button ikmi-button--secondary min-h-11 rounded-md px-4 text-sm font-semibold">Terapkan</button>
          </div>
          {hasFilters && (
            <div className="flex items-center gap-2">
              <Link href="/admin/agendas" prefetch={false} className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-accent">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Hapus filter
              </Link>
            </div>
          )}
        </div>
      </form>

      {agendas.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={hasFilters ? 'Tidak ada Agenda cocok' : 'Belum ada Agenda'}
          description={hasFilters ? 'Coba ubah filter pencarian.' : workspace.selectedPeriodId === workspace.activePeriodId ? 'Buat Agenda pertama untuk periode aktif Anda.' : 'Tidak ada Agenda pada periode yang dipilih.'}
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
                      <p className="text-xs font-extrabold uppercase text-accent">
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
