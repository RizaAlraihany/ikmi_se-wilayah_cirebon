import { Skeleton } from '@/components/ui/skeleton'

export default function RequestPamfletLoading() {
  return (
    <main className="min-h-dvh bg-background" aria-busy="true" aria-label="Memuat formulir Request Pamflet">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-[min(100%,28rem)]" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-8 space-y-5 border-t border-border pt-7">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Memuat formulir...</span>
    </main>
  )
}
