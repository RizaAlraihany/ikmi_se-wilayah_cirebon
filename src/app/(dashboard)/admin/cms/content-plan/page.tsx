import { ContentPlanStatus } from '@prisma/client'
import { CalendarDays, CheckCircle2, Clock, PenLine } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { contentPlanQueries } from '@/features/content-plan/queries'
import { createContentPlanAction, updateContentPlanStatusAction } from '@/features/content-plan/actions'
import { prisma } from '@/core/database/prisma'

export const metadata = {
  title: 'Content Plan | IKMI Cirebon',
}

const statusTone: Record<ContentPlanStatus, 'surface' | 'warning' | 'accent' | 'success'> = {
  PLANNED: 'surface',
  IN_PROGRESS: 'warning',
  READY: 'accent',
  PUBLISHED: 'success',
}

const nextStatus: Partial<Record<ContentPlanStatus, ContentPlanStatus>> = {
  PLANNED: ContentPlanStatus.IN_PROGRESS,
  IN_PROGRESS: ContentPlanStatus.READY,
  READY: ContentPlanStatus.PUBLISHED,
}

export default async function ContentPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const month = params.month || new Date().toISOString().slice(0, 7)
  const [plans, statusCounts, authors] = await Promise.all([
    contentPlanQueries.getPlans(month),
    contentPlanQueries.getStatusCounts(),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        departmentId: session.user.departmentId || undefined,
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const counts = Object.fromEntries(statusCounts.map((item) => [item.status, item._count.id]))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Content Planning</h1>
          <p className="mt-1 text-sm text-muted">Rencanakan kalender publikasi bulanan, writer, dan status produksi.</p>
        </div>
        <form className="flex items-center gap-2">
          <Input type="month" name="month" defaultValue={month} aria-label="Pilih bulan content plan" />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {contentPlanQueries.statuses.map((status) => (
          <Card key={status}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                {status === 'PUBLISHED' ? <CheckCircle2 className="h-5 w-5" /> : status === 'READY' ? <Clock className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">{status}</p>
                <p className="font-heading text-2xl font-extrabold text-primary">{counts[status] || 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <form
            action={async (formData) => {
              'use server'
              await createContentPlanAction(formData)
            }}
            className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
          >
            <Input name="title" placeholder="Judul konten" aria-label="Judul konten" required />
            <Input name="platform" placeholder="Website / Instagram" aria-label="Platform" required />
            <Input name="publishDate" type="datetime-local" aria-label="Jadwal publish" required />
            <Select name="authorId" aria-label="Assigned writer">
              {authors.map((author) => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </Select>
            <input type="hidden" name="status" value={ContentPlanStatus.PLANNED} />
            <Button type="submit">Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <CalendarDays className="h-10 w-10 text-accent" />
              <h2 className="font-heading text-xl font-bold text-primary">Belum ada content plan</h2>
              <p className="max-w-md text-sm text-muted">Tambahkan rencana publikasi untuk bulan terpilih agar kalender editorial Komdigi rapi.</p>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => {
            const next = nextStatus[plan.status]
            return (
              <Card key={plan.id}>
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[plan.status]}>{plan.status}</Badge>
                      <span className="text-sm font-semibold text-muted">{plan.platform}</span>
                    </div>
                    <h2 className="font-heading text-lg font-bold text-primary">{plan.title}</h2>
                    <p className="text-sm text-muted">
                      {plan.publishDate.toLocaleString('id-ID')} - {plan.author.name}
                      {plan.author.department ? ` (${plan.author.department.name})` : ''}
                    </p>
                  </div>
                  {next ? (
                    <form
                      action={async () => {
                        'use server'
                        await updateContentPlanStatusAction(plan.id, next)
                      }}
                    >
                      <Button type="submit" variant="secondary" size="sm">Set {next}</Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
