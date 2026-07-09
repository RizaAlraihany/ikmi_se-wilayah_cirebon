import { BookOpen, CheckCircle, Search } from 'lucide-react'
import { registrationQueries } from '@/features/registration/queries'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const q = params.q || ''
  const { data: registrations, meta } = await registrationQueries.getPaginatedRegistrations(page, 10, q)

  return (
    <div className="space-y-6">
      <PageHeader title="Pendaftaran Kader" description="Review pendaftar baru dan tindak lanjuti proses kaderisasi." />
      <Card>
        <CardContent className="space-y-5 p-5">
          <form className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Cari nama atau kampus..." className="pl-11" aria-label="Cari pendaftar" />
          </form>

          {registrations.length === 0 ? (
            <EmptyState icon={BookOpen} title="Belum ada pendaftar" description="Pendaftar yang masuk dari halaman publik akan muncul di sini." actionHref="/register" actionLabel="Buka Form Publik" />
          ) : (
            <div className="grid gap-3">
              {registrations.map((registration) => (
                <Card key={registration.id}>
                  <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted">{new Date(registration.createdAt).toLocaleDateString('id-ID')}</p>
                      <h3 className="font-heading text-lg font-bold">{registration.fullName}</h3>
                      <p className="text-sm text-muted">{registration.campus} - Semester {registration.semester}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={registration.status === 'PROCESSED' ? 'success' : 'warning'}>{registration.status}</Badge>
                      {registration.status === 'PENDING' ? (
                        <form action={async () => {
                          'use server'
                          const { markProcessedAction } = await import('@/features/registration/actions')
                          await markProcessedAction(registration.id)
                        }}>
                          <Button type="submit" size="sm" variant="secondary">
                            <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                            Tandai Diproses
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}

function Pagination({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  return <p className="border-t border-line pt-4 text-sm text-muted">Halaman {page} dari {totalPages || 1} ({total} pendaftar)</p>
}
