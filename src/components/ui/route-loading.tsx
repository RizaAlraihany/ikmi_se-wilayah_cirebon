import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

export function PublicRouteLoading({ className }: { className?: string }) {
  return (
    <main className={cn('public-page-root min-h-dvh', className)} aria-busy="true" aria-label="Memuat halaman">
      <header className="public-page-header">
        <div className="public-container py-10 sm:py-14">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-10 w-[min(100%,34rem)] sm:h-12" />
          <Skeleton className="mt-4 h-4 w-[min(92%,42rem)]" />
          <Skeleton className="mt-2 h-4 w-[min(74%,34rem)]" />
        </div>
      </header>
      <section className="public-container py-10 sm:py-14">
        <Skeleton className="h-6 w-44" />
        <div className="mt-5 divide-y divide-border border-y border-border">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="grid gap-3 py-5 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <Skeleton className="h-4 w-20" />
              <div>
                <Skeleton className="h-6 w-[min(100%,32rem)]" />
                <Skeleton className="mt-3 h-4 w-[min(88%,40rem)]" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Memuat konten...</span>
    </main>
  )
}

export function DashboardRouteLoading() {
  return (
    <div className="dashboard-page" aria-busy="true" aria-label="Memuat ruang kerja admin">
      <header className="dashboard-page-header">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-[min(100%,24rem)]" />
          <Skeleton className="mt-3 h-4 w-[min(86%,34rem)]" />
        </div>
      </header>
      <section className="dashboard-summary-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="dashboard-summary-item">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </section>
      <section className="mt-6">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 divide-y divide-border border-y border-border bg-surface">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 py-4">
              <Skeleton className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-[min(82%,24rem)]" />
                <Skeleton className="mt-2 h-4 w-[min(64%,18rem)]" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Memuat ruang kerja admin...</span>
    </div>
  )
}
