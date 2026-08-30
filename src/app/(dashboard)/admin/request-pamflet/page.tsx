import type { Metadata } from 'next'
import { getPamfletRequests } from '@/features/request-pamflet/admin-actions'
import { PamfletRequestStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Eye, CalendarDays, Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PAMFLET_STATUS_LABELS } from '@/features/request-pamflet/domain'
import { KomdigiPageHeader, KomdigiPanel } from '../_components/komdigi-page-header'

export const metadata: Metadata = {
  title: 'Request Pamflet - Dashboard IKMI',
}

const statusTone: Record<PamfletRequestStatus, 'surface' | 'warning' | 'accent' | 'success' | 'danger'> = {
  BARU: 'accent',
  DITERIMA: 'accent',
  DIKERJAKAN: 'warning',
  PERLU_REVISI: 'warning',
  SELESAI: 'success',
  DITOLAK: 'danger',
  DIBATALKAN: 'surface',
}

const requestDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

export default async function RequestPamfletDashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams
  const q = params.q
  const statusFilter = params.status && Object.values(PamfletRequestStatus).includes(params.status as PamfletRequestStatus)
    ? params.status as PamfletRequestStatus
    : undefined

  const requests = await getPamfletRequests(q, statusFilter)

  return (
    <div className="space-y-6">
      <KomdigiPageHeader
        title="Inbox Request Pamflet"
        description="Pusat penerimaan dan pengelolaan permintaan desain dari seluruh unit organisasi."
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <nav className="no-scrollbar flex w-full gap-6 overflow-x-auto border-b border-border/60 xl:w-auto" aria-label="Filter status Request Pamflet">
          {[
            ['Semua', ''],
            ['Baru', 'BARU'],
            ['Dikerjakan', 'DIKERJAKAN'],
            ['Revisi', 'PERLU_REVISI'],
            ['Selesai', 'SELESAI'],
          ].map(([label, value]) => {
            const active = (statusFilter ?? '') === value
            return (
              <Link
                key={label}
                href={value ? `/admin/request-pamflet?status=${value}` : '/admin/request-pamflet'}
                className={cn(
                  'whitespace-nowrap border-b-[3px] pb-3 text-sm transition-colors',
                  active ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-text-secondary hover:text-primary',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <form className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto] xl:max-w-xl" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Cari kegiatan..." aria-label="Cari Request Pamflet" className="glass-subtle pl-9" />
          </div>
          <Select name="status" defaultValue={statusFilter ?? ''} aria-label="Filter status Request Pamflet">
            <option value="">Semua status</option>
            {Object.values(PamfletRequestStatus).map((status) => <option key={status} value={status}>{PAMFLET_STATUS_LABELS[status]}</option>)}
          </Select>
          <Button type="submit">Terapkan</Button>
        </form>
      </div>

      <div className="divide-y divide-border border-y border-border lg:hidden">
        {requests.map((req) => (
          <article key={req.id} className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-text-muted">{req.requestNumber}</p>
                <h2 className="mt-1 break-words font-heading text-lg font-extrabold leading-snug text-primary">{req.activityName}</h2>
              </div>
              <Badge tone={statusTone[req.status]}>{PAMFLET_STATUS_LABELS[req.status]}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Unit / Pengaju</dt>
                <dd className="mt-1 break-words text-primary">{req.requesterUnit} · {req.requesterName}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">PIC</dt>
                <dd className="mt-1 text-primary">{req.assignee?.name ?? 'Belum ditugaskan'}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <span className="inline-flex items-center gap-2 text-text-secondary">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                Deadline {requestDateFormatter.format(req.deadline)}
              </span>
              <ButtonLink href={`/admin/request-pamflet/${req.id}`} size="sm" variant="secondary">
                Detail
              </ButtonLink>
            </div>
          </article>
        ))}
        {requests.length === 0 && (
          <p className="py-8 text-sm text-text-secondary">Belum ada Request Pamflet yang sesuai.</p>
        )}
      </div>

      <KomdigiPanel className="hidden lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/60 bg-white/40 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-6 py-4">No. Request</th>
              <th className="px-6 py-4">Kegiatan</th>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">PIC</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map(req => (
              <tr key={req.id} className="transition-colors hover:bg-white/50">
                <td className="px-6 py-4 font-mono text-xs">{req.requestNumber}</td>
                <td className="px-6 py-4 font-medium text-primary">
                  {req.activityName}
                  {req.program ? <span className="block text-xs font-normal text-text-muted">Program: {req.program.name}</span> : null}
                  {req.agenda ? <span className="block text-xs font-normal text-text-muted">Agenda: {req.agenda.name}</span> : null}
                </td>
                <td className="px-6 py-4"><span className="font-medium text-primary">{req.requesterUnit}</span><span className="block text-xs text-text-muted">{req.requesterName}</span></td>
                <td className="px-6 py-4">{requestDateFormatter.format(req.deadline)}</td>
                <td className="px-6 py-4">{req.assignee?.name ?? <span className="text-text-muted">Belum ditugaskan</span>}</td>
                <td className="px-6 py-4">
                  <Badge tone={statusTone[req.status]}>{PAMFLET_STATUS_LABELS[req.status]}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <ButtonLink href={`/admin/request-pamflet/${req.id}`} size="sm" variant="ghost">
                    <Eye className="mr-2 h-4 w-4" />
                    Buka
                  </ButtonLink>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  Belum ada Request Pamflet yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </KomdigiPanel>
    </div>
  )
}
