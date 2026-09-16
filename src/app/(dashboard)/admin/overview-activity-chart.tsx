type ActivityPoint = {
  month: string
  count: number
}

type ActivitySeries = {
  label: string
  tone: 'primary' | 'accent'
  points: ActivityPoint[]
}

const barTones = {
  primary: 'bg-primary',
  accent: 'bg-accent',
} as const

export function OverviewActivityChart({ series }: { series: ActivitySeries[] }) {
  const points = series[0]?.points ?? []
  const maximum = Math.max(1, ...series.flatMap((item) => item.points.map((point) => point.count)))

  if (points.length === 0) return null

  return (
    <section className="border-t-2 border-primary pt-5" aria-labelledby="overview-activity-title">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase text-accent">Analitik aktivitas</p>
          <h2 id="overview-activity-title" className="mt-1 font-heading text-xl font-bold text-balance text-primary">
            Perkembangan enam bulan terakhir
          </h2>
          <p className="mt-1 text-sm leading-6 text-pretty text-text-secondary">
            Ringkasan ini dihitung dari data yang tersimpan di dashboard pada tahun berjalan.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-text-secondary" aria-label="Keterangan grafik">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span className={`size-2 rounded-sm ${barTones[item.tone]}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-6 gap-2 sm:gap-3" aria-label="Grafik aktivitas bulanan">
        {points.map((point, index) => {
          const values = series.map((item) => item.points[index]?.count ?? 0)
          const label = values.map((value, valueIndex) => `${series[valueIndex].label}: ${value}`).join(', ')

          return (
            <li key={point.month} className="min-w-0">
              <div className="flex h-28 items-end justify-center gap-1 border-b border-border pb-2" role="img" aria-label={`${point.month}, ${label}`}>
                {values.map((value, valueIndex) => (
                  <span
                    key={series[valueIndex].label}
                    className={`w-full max-w-4 rounded-t-sm ${barTones[series[valueIndex].tone]}`}
                    style={{ height: `${value === 0 ? 0 : (value / maximum) * 100}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="mt-2 truncate text-center text-xs font-semibold text-text-secondary">{point.month}</p>
              <p className="mt-1 text-center text-sm font-bold tabular-nums text-primary">{values.reduce((total, value) => total + value, 0)}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
