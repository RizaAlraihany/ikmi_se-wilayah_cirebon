import Link from 'next/link'
import { CalendarDays, FolderKanban, List, Plus, Rows3 } from 'lucide-react'
import { programQueries } from '@/features/programs/queries'
import { deriveProgramStatus, programStatusLabel, programVisibilityLabel } from '@/features/programs/domain'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

type SearchParams = Promise<{ period?: string; view?: string }>

function statusTone(status: ReturnType<typeof deriveProgramStatus>) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'ONGOING') return 'primary'
  if (status === 'POSTPONED' || status === 'CANCELLED') return 'danger'
  return 'warning'
}

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(value) : 'Belum dijadwalkan'
}

export default async function AdminProgramsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const workspace = await programQueries.getProgramWorkspace(params.period)
  const view = params.view === 'calendar' ? 'calendar' : 'list'
  const periodQuery = workspace.selectedPeriodId ? `?period=${encodeURIComponent(workspace.selectedPeriodId)}` : ''

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border-y-2 border-primary bg-surface px-1 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-5">
      <div>
        <p className="text-xs font-bold uppercase text-accent">Organisasi</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Kegiatan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-text-secondary">Program kerja periode aktif, jadwal pelaksanaan, dan relasi publikasi dikelola dari satu workspace.</p>
      </div>
      <ButtonLink href="/admin/programs/new" prefetch={false}><Plus className="size-4" aria-hidden="true" />Kegiatan Baru</ButtonLink>
    </header>

    <section className="flex flex-col gap-3 border-y border-border bg-surface px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <form className="flex min-w-0 items-center gap-3" action="/admin/programs">
        <label htmlFor="period" className="shrink-0 text-sm font-semibold text-primary">Periode</label>
        <select id="period" name="period" defaultValue={workspace.selectedPeriodId ?? ''} className="h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary">
          {workspace.periods.map((period) => <option key={period.id} value={period.id}>{period.name}{period.id === workspace.activePeriodId ? ' · Aktif' : ''}</option>)}
        </select>
        <input type="hidden" name="view" value={view} />
        <button type="submit" className="ikmi-button ikmi-button--secondary min-h-11 rounded-md px-4 text-sm font-semibold">Tampilkan</button>
      </form>
      <div className="flex w-full gap-2 sm:w-auto" aria-label="Mode tampilan kegiatan">
        <ButtonLink href={`/admin/programs${periodQuery}`} variant={view === 'list' ? 'primary' : 'secondary'} size="sm" className="flex-1 sm:flex-none"><List className="size-4" aria-hidden="true" />Daftar</ButtonLink>
        <ButtonLink href={`/admin/programs${periodQuery ? `${periodQuery}&` : '?'}view=calendar`} variant={view === 'calendar' ? 'primary' : 'secondary'} size="sm" className="flex-1 sm:flex-none"><CalendarDays className="size-4" aria-hidden="true" />Kalender</ButtonLink>
      </div>
    </section>

    {workspace.programs.length === 0 ? <EmptyState icon={FolderKanban} title="Belum ada Kegiatan" description={workspace.selectedPeriodId === workspace.activePeriodId ? 'Buat kegiatan pertama untuk periode aktif ini.' : 'Tidak ada kegiatan pada periode yang dipilih.'} /> : view === 'calendar' ? <ProgramCalendar programs={workspace.programs} /> : <ProgramList programs={workspace.programs} />}
  </div>
}

function ProgramList({ programs }: { programs: Awaited<ReturnType<typeof programQueries.getProgramWorkspace>>['programs'] }) {
  const now = new Date()
  return <ul className="divide-y divide-border border-y border-border bg-surface">{programs.map((program) => {
    const status = deriveProgramStatus(program, now)
    return <li key={program.id}><Link href={`/admin/programs/${program.id}`} prefetch={false} className="grid min-h-24 gap-4 px-1 py-5 hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold uppercase text-accent">{program.department.name}</p><Badge tone={statusTone(status)}>{programStatusLabel(status)}</Badge></div><h2 className="mt-2 font-heading text-lg font-bold text-balance text-primary">{program.name}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-pretty text-text-secondary">{program.description}</p></div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-secondary md:max-w-64 md:justify-end"><span>{dateLabel(program.plannedStart)}</span><span>{programVisibilityLabel(program.visibility)}</span>{program.campaignEnabled ? <span className="text-accent">Banner aktif</span> : null}</div></Link></li>
  })}</ul>
}

function ProgramCalendar({ programs }: { programs: Awaited<ReturnType<typeof programQueries.getProgramWorkspace>>['programs'] }) {
  const scheduled = programs.filter((program) => program.plannedStart)
  const unscheduled = programs.filter((program) => !program.plannedStart)
  const groups = new Map<string, typeof scheduled>()
  for (const program of scheduled) {
    const key = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(program.plannedStart!)
    groups.set(key, [...(groups.get(key) ?? []), program])
  }
  return <div className="space-y-6"><section className="border-y border-border bg-surface">{[...groups.entries()].map(([month, entries]) => <div key={month} className="border-b border-border last:border-b-0"><h2 className="px-4 py-3 font-heading text-lg font-bold text-balance text-primary">{month}</h2><ul className="divide-y divide-border">{entries.map((program) => <li key={program.id}><Link href={`/admin/programs/${program.id}`} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-alt"><span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-primary/8 text-primary"><span className="text-sm font-extrabold tabular-nums">{new Intl.DateTimeFormat('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' }).format(program.plannedStart!)}</span></span><span className="min-w-0 flex-1"><span className="block font-semibold text-primary">{program.name}</span><span className="mt-0.5 block text-xs text-text-secondary">{program.department.name} · {dateLabel(program.plannedStart)}</span></span><Rows3 className="size-4 shrink-0 text-text-muted" aria-hidden="true" /></Link></li>)}</ul></div>)}</section>{unscheduled.length ? <section className="border-l-2 border-warning bg-surface-alt px-4 py-4"><h2 className="font-heading text-lg font-bold text-primary">Belum dijadwalkan</h2><p className="mt-1 text-sm leading-6 text-text-secondary">Kegiatan ini tetap tersimpan tanpa tanggal dummy dan perlu dijadwalkan saat rencana sudah tersedia.</p><ul className="mt-3 space-y-2">{unscheduled.map((program) => <li key={program.id}><Link href={`/admin/programs/${program.id}`} className="font-semibold text-primary underline underline-offset-4">{program.name}</Link></li>)}</ul></section> : null}</div>
}
