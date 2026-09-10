import { Skeleton } from '@/components/ui/skeleton'

export default function PublicationLoading() {
  return (
    <main className="public-page-root min-h-dvh" aria-busy="true" aria-label="Memuat publikasi">
      <section className="public-page-content">
        <div className="public-container py-8 sm:py-12">
          <Skeleton className="h-4 w-48" />

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
            <article className="space-y-5 lg:col-span-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-full max-w-3xl sm:h-16" />
              <Skeleton className="h-5 w-full max-w-2xl" />
              <div className="flex gap-4 border-y border-border py-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <div className="space-y-3 pt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[78%]" />
                <Skeleton className="mt-6 h-4 w-full" />
                <Skeleton className="h-4 w-[88%]" />
              </div>
            </article>

            <aside className="hidden space-y-6 lg:col-span-4 lg:block">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </aside>
          </div>
        </div>
      </section>
      <span className="sr-only">Memuat artikel publikasi...</span>
    </main>
  )
}
