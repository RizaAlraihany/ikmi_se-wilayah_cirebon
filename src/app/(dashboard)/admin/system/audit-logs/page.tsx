import Link from 'next/link'
import { AuditAction } from '@prisma/client'
import { Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { auditQueries } from '@/features/audit/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { JsonDiffViewer } from './components/JsonDiffViewer'

export const metadata = {
  title: 'Audit Log | IKMI Cirebon',
}

const auditActionLabels: Record<AuditAction, string> = {
  CREATE: 'Membuat',
  UPDATE: 'Memperbarui',
  DELETE: 'Menghapus',
  APPROVE: 'Menyetujui',
  REJECT: 'Menolak',
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login gagal',
  LOGOUT: 'Logout',
  AUTHORIZATION_FAILED: 'Akses ditolak',
  STATUS_CHANGE: 'Ubah status',
  ROLE_CHANGE: 'Ubah role',
  SECURITY_SETTING_CHANGE: 'Ubah keamanan',
  PUBLISH: 'Menerbitkan',
  ARCHIVE: 'Mengarsipkan',
  VERIFY: 'Memverifikasi',
  DOWNLOAD: 'Mengunduh',
}

type ResolvedSearchParams = { [key: string]: string | string[] | undefined }

interface ActiveFilters {
  userId?: string
  action?: AuditAction
  entity?: string
  dateFrom?: string
  dateTo?: string
}

function firstString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

function safeFilterValue(value: string | undefined, maxLength: number) {
  const normalized = value?.trim()
  return normalized && normalized.length <= maxLength ? normalized : undefined
}

function safeDateValue(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

function jakartaDay(value: string | undefined, exclusiveEnd = false) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00+07:00`)
  if (Number.isNaN(date.getTime())) return undefined
  if (exclusiveEnd) date.setUTCDate(date.getUTCDate() + 1)
  return date
}

function getAuditTone(action: AuditAction): React.ComponentProps<typeof Badge>['tone'] {
  switch (action) {
    case 'CREATE':
    case 'APPROVE':
    case 'VERIFY':
      return 'success'
    case 'UPDATE':
    case 'STATUS_CHANGE':
    case 'ROLE_CHANGE':
    case 'SECURITY_SETTING_CHANGE':
    case 'PUBLISH':
      return 'accent'
    case 'DELETE':
    case 'REJECT':
    case 'LOGIN_FAILED':
    case 'AUTHORIZATION_FAILED':
      return 'danger'
    default:
      return 'surface'
  }
}

function formatAuditDate(value: Date) {
  return `${new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(value)} WIB`
}

function buildPageHref(page: number, filters: ActiveFilters) {
  const params = new URLSearchParams({ page: String(page) })
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  return `/admin/system/audit-logs?${params.toString()}`
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<ResolvedSearchParams>
}) {
  const resolvedParams = await searchParams
  const parsedPage = Number.parseInt(firstString(resolvedParams.page) ?? '1', 10)
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const userId = safeFilterValue(firstString(resolvedParams.userId), 150)
  const entity = safeFilterValue(firstString(resolvedParams.entity), 80)
  const actionValue = safeFilterValue(firstString(resolvedParams.action), 40)
  const action = actionValue && Object.values(AuditAction).includes(actionValue as AuditAction)
    ? actionValue as AuditAction
    : undefined
  const dateFrom = safeDateValue(firstString(resolvedParams.dateFrom))
  const dateTo = safeDateValue(firstString(resolvedParams.dateTo))
  const activeFilters: ActiveFilters = { userId, action, entity, dateFrom, dateTo }

  const { logs, actors, entities, page, totalItems, totalPages } = await auditQueries.getAuditLogPage({
    page: requestedPage,
    userId,
    action,
    entity,
    dateFrom: jakartaDay(dateFrom),
    dateToExclusive: jakartaDay(dateTo, true),
  })

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-primary">
          <Activity className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-primary">Audit Log Sistem</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Riwayat baca-saja untuk tindakan penting, perubahan data, dan kejadian keamanan.
          </p>
        </div>
      </header>

      <section className="border-y border-line py-5" aria-labelledby="audit-filter-title">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 id="audit-filter-title" className="font-heading text-base font-bold text-primary">Filter audit</h2>
        </div>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm font-semibold text-primary">
            <span>Pengguna</span>
            <Select name="userId" defaultValue={userId ?? ''}>
              <option value="">Semua pengguna</option>
              {actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-primary">
            <span>Aksi</span>
            <Select name="action" defaultValue={action ?? ''}>
              <option value="">Semua aksi</option>
              {Object.values(AuditAction).map((value) => (
                <option key={value} value={value}>{auditActionLabels[value]}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-primary">
            <span>Entitas</span>
            <Select name="entity" defaultValue={entity ?? ''}>
              <option value="">Semua entitas</option>
              {entities.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-primary">
            <span>Dari tanggal</span>
            <Input type="date" name="dateFrom" defaultValue={dateFrom ?? ''} />
          </label>
          <label className="space-y-2 text-sm font-semibold text-primary">
            <span>Sampai tanggal</span>
            <Input type="date" name="dateTo" defaultValue={dateTo ?? ''} />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 xl:col-span-5">
            <Button type="submit">Terapkan filter</Button>
            <Link
              href="/admin/system/audit-logs"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-primary transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Tidak ada catatan audit"
          description="Belum ada aktivitas yang cocok dengan filter ini."
        />
      ) : (
        <>
          <div className="grid gap-4 md:hidden" aria-label="Daftar audit log">
            {logs.map((log) => (
              <article key={log.id} className="border-b border-line pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-bold text-primary">{log.user?.name ?? 'Sistem'}</p>
                    <p className="mt-1 text-xs text-muted">{formatAuditDate(log.createdAt)}</p>
                  </div>
                  <Badge tone={getAuditTone(log.action)}>{auditActionLabels[log.action]}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Entitas</dt>
                    <dd className="mt-1 font-medium text-primary">{log.entity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">ID Entitas</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-primary">{log.entityId}</dd>
                  </div>
                </dl>
                {Boolean(log.oldData || log.newData) && (
                  <div className="mt-4"><JsonDiffViewer oldData={log.oldData} newData={log.newData} /></div>
                )}
              </article>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Riwayat audit sistem</caption>
                <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4">Waktu</th>
                    <th scope="col" className="px-5 py-4">Pengguna</th>
                    <th scope="col" className="px-5 py-4">Aksi</th>
                    <th scope="col" className="px-5 py-4">Entitas</th>
                    <th scope="col" className="px-5 py-4">ID Entitas</th>
                    <th scope="col" className="px-5 py-4 text-right">Konteks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-background">
                      <td className="whitespace-nowrap px-5 py-4 text-muted">{formatAuditDate(log.createdAt)}</td>
                      <td className="px-5 py-4 font-semibold text-primary">{log.user?.name ?? 'Sistem'}</td>
                      <td className="px-5 py-4"><Badge tone={getAuditTone(log.action)}>{auditActionLabels[log.action]}</Badge></td>
                      <td className="px-5 py-4 font-semibold text-primary/80">{log.entity}</td>
                      <td className="max-w-56 break-all px-5 py-4 font-mono text-xs text-muted">{log.entityId}</td>
                      <td className="px-5 py-4 text-right">
                        {Boolean(log.oldData || log.newData)
                          ? <JsonDiffViewer oldData={log.oldData} newData={log.newData} />
                          : <span className="text-xs text-muted">Tidak ada</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Halaman <span className="font-semibold text-primary">{page}</span> dari{' '}
            <span className="font-semibold text-primary">{totalPages}</span> ({totalItems} entri)
          </p>
          <nav className="flex items-center gap-2" aria-label="Paginasi audit log">
            <Link
              href={buildPageHref(Math.max(1, page - 1), activeFilters)}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                page <= 1 && 'pointer-events-none opacity-50',
              )}
              aria-disabled={page <= 1}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={buildPageHref(Math.min(totalPages, page + 1), activeFilters)}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                page >= totalPages && 'pointer-events-none opacity-50',
              )}
              aria-disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </CardContent>
      </Card>
    </div>
  )
}
