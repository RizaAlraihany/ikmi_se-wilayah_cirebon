import { Skeleton } from "@/components/ui/skeleton";

export function HomepageLoading() {
  return (
    <main className="home-page" aria-busy="true" aria-label="Memuat Beranda IKMI">
      <section className="min-h-[29rem] bg-primary">
        <div className="mx-auto flex min-h-[29rem] w-[min(100%-2rem,75rem)] items-end py-10 sm:w-[min(100%-3rem,75rem)] md:items-center">
          <div className="w-full max-w-lg space-y-4">
            <Skeleton className="h-3 w-28 bg-white/20" />
            <Skeleton className="h-14 w-full max-w-sm bg-white/20" />
            <Skeleton className="h-4 w-full max-w-md bg-white/20" />
            <Skeleton className="h-4 w-4/5 bg-white/20" />
          </div>
        </div>
      </section>
      <section className="mx-auto w-[min(100%-2rem,75rem)] py-10 sm:w-[min(100%-3rem,75rem)]">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-[min(100%,24rem)]" />
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {[0, 1].map((item) => <Skeleton key={item} className="h-48" />)}
        </div>
      </section>
      <span className="sr-only">Memuat konten Beranda...</span>
    </main>
  );
}
