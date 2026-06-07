import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuditAction } from '@prisma/client'
import { Activity, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { auditQueries } from '@/features/audit/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { JsonDiffViewer } from './components/JsonDiffViewer'

export const metadata = {
  title: 'Audit Logs | IKMI Cirebon',
}

function getAuditTone(action: AuditAction): React.ComponentProps<typeof Badge>['tone'] {
  switch (action) {
    case 'CREATE':
    case 'APPROVE':
    case 'VERIFY':
      return 'success'
    case 'UPDATE':
    case 'PUBLISH':
      return 'accent'
    case 'DELETE':
    case 'REJECT':
      return 'danger'
    case 'LOGIN':
    case 'LOGOUT':
      return 'surface'
  }
  return 'surface'
}

function buildPageHref(page: number, entity?: string) {
  const params = new URLSearchParams({ page: String(page) })
  if (entity) params.set('entity', entity)
  return `/admin/system/audit-logs?${params.toString()}`
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user || session.user.roleId !== 'super_admin') {
    redirect('/admin')
  }

  const resolvedParams = await searchParams
  const parsedPage = typeof resolvedParams.page === 'string' ? Number.parseInt(resolvedParams.page, 10) : 1
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const entity = typeof resolvedParams.entity === 'string' && resolvedParams.entity ? resolvedParams.entity : undefined
  const limit = 20
  const skip = (page - 1) * limit

  const [logs, totalItems] = await Promise.all([
    auditQueries.getAuditLogs(skip, limit, entity),
    auditQueries.getAuditLogsCount(entity),
  ])

  const totalPages = Math.ceil(totalItems / limit) || 1

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-primary">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-primary">Sistem Audit Logs</h1>
              <p className="mt-1 text-sm text-muted">Pantau seluruh aktivitas mutasi data dalam sistem.</p>
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              name="entity"
              defaultValue={entity || ''}
              placeholder="Filter entitas"
              className="pl-10 sm:w-72"
              aria-label="Filter audit log berdasarkan entitas"
            />
          </div>
          <Button type="submit">Cari</Button>
        </form>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Tidak ada catatan audit"
          description="Aktivitas sistem yang sesuai filter akan tampil di sini."
        />
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-base font-bold text-primary">{log.user?.name || 'Sistem'}</p>
                      <p className="text-sm text-muted">{log.user?.email || log.entityId}</p>
                    </div>
                    <Badge tone={getAuditTone(log.action)}>{log.action}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Entitas</p>
                      <p className="font-medium text-primary">{log.entity}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Waktu</p>
                      <p className="font-medium text-primary">{new Date(log.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  {(log.oldData || log.newData) && (
                    <JsonDiffViewer oldData={log.oldData} newData={log.newData} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-4">Waktu</th>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Aksi</th>
                    <th className="px-5 py-4">Entitas</th>
                    <th className="px-5 py-4">ID Entitas</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-background">
                      <td className="whitespace-nowrap px-5 py-4 text-muted">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-semibold text-primary">{log.user?.name || 'Sistem'}</span>
                        <span className="block text-xs text-muted">{log.user?.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getAuditTone(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary/80">{log.entity}</td>
                      <td className="px-5 py-4 font-mono text-xs text-muted">{log.entityId}</td>
                      <td className="px-5 py-4 text-right">
                        {(log.oldData || log.newData) ? (
                          <JsonDiffViewer oldData={log.oldData} newData={log.newData} />
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
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
            Halaman <span className="font-semibold text-primary">{page}</span> dari <span className="font-semibold text-primary">{totalPages}</span> ({totalItems} entri)
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildPageHref(page > 1 ? page - 1 : 1, entity)}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5',
                page <= 1 && 'pointer-events-none opacity-50',
              )}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={buildPageHref(page < totalPages ? page + 1 : totalPages, entity)}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5',
                page >= totalPages && 'pointer-events-none opacity-50',
              )}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
