import { ContentPlanStatus } from '@prisma/client'
import { CalendarDays, CheckCircle2, Clock, PenLine } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ContentPlanForm } from './components/ContentPlanForm'
import { contentPlanQueries } from '@/features/content-plan/queries'
import { updateContentPlanStatusAction } from '@/features/content-plan/actions'
import { prisma } from '@/core/database/prisma'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
      select: { id: true, name: true, department: { select: { name: true } } },
    }),
  ])

  const counts = Object.fromEntries(statusCounts.map((item) => [item.status, item._count.id]))
  
  // Sort plans nearest first
  const sortedPlans = [...plans].sort((a, b) => a.publishDate.getTime() - b.publishDate.getTime())

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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

      <Card className="hidden md:block">
        <CardContent className="p-6">
          <ContentPlanForm authors={authors} />
        </CardContent>
      </Card>
      
      <div className="md:hidden">
        <ContentPlanForm authors={authors} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-xl font-bold text-primary">
            Daftar Publikasi
          </h2>
          <Badge tone="surface">{plans.length} plan</Badge>
        </div>

        {sortedPlans.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
              <CalendarDays className="mb-4 h-10 w-10 opacity-20" />
              <p>Belum ada rencana konten di bulan ini.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedPlans.map((plan) => {
              const next = nextStatus[plan.status]
              return (
                <Card key={plan.id} className="transition hover:-translate-y-0.5 hover:shadow-float">
                  <CardContent className="p-0">
                    <div className="block w-full p-4 text-left sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-xs font-bold uppercase tracking-wide text-accent">
                            {format(plan.publishDate, 'EEEE, d MMMM yyyy - HH:mm', { locale: id })}
                          </p>
                          <h3 className="line-clamp-2 font-heading text-lg font-extrabold leading-tight text-primary">
                            {plan.title}
                          </h3>
                        </div>
                        <Badge tone={statusTone[plan.status]} className="shrink-0">
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">
                        Platform: <span className="font-semibold text-primary">{plan.platform}</span>
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <PenLine className="h-4 w-4" />
                          <span className="truncate">{plan.author?.name || 'Unassigned'}</span>
                        </div>
                        {next ? (
                          <form action={async () => { 'use server'; await updateContentPlanStatusAction(plan.id, next) }}>
                            <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs">
                              Tandai {next}
                            </Button>
                          </form>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
