import type { Metadata } from 'next'
import {
  buildCalendarGrid,
  calendarDateKey,
  calendarMonthRange,
  groupEventsByDate,
  normalizeCalendarMonth,
  normalizeSelectedCalendarDate,
} from '@/features/public/calendar-domain'
import { getPublicCalendarEvents } from '@/features/public/public-calendar'
import {
  CalendarFilters,
  CalendarLegend,
  DesktopCalendarGrid,
  MobileCalendar,
} from '../_components/calendar-ui'
import Link from 'next/link'
import { siteUrl } from '@/core/seo/site'
import { PublicPageHero } from '../_components/public-page-hero'

export const metadata: Metadata = {
  title: 'Kalender Kegiatan',
  description:
    'Lihat Program dan Agenda IKMI Cirebon yang akan datang dalam satu kalender terpadu. Selalu up-to-date dengan kegiatan organisasi mahasiswa IKMI Se-Wilayah Cirebon.',
  alternates: { canonical: `${siteUrl}/kalender` },
  openGraph: {
    title: 'Kalender Kegiatan IKMI Cirebon',
    description:
      'Jadwal Program dan Agenda IKMI Cirebon. Selalu up-to-date dengan kegiatan resmi organisasi.',
    url: `${siteUrl}/kalender`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{
    year?: string
    month?: string
    date?: string
    type?: string
  }>
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function PublicCalendarPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const todayStr = calendarDateKey(now)
  const currentMonth = normalizeCalendarMonth(params.year, params.month, now)
  const { year, month } = currentMonth
  const selectedDate = normalizeSelectedCalendarDate(params.date, year, month, todayStr)
  const eventType = params.type === 'program' || params.type === 'agenda' ? params.type : 'all'

  const [rangeStart, rangeEnd] = calendarMonthRange(year, month)
  const allEvents = await getPublicCalendarEvents(rangeStart, rangeEnd)
  const events = eventType === 'all' ? allEvents : allEvents.filter((event) => event.type === eventType)
  const eventsByDate = groupEventsByDate(events)
  const days = buildCalendarGrid(year, month)

  return (
    <main className="public-page-root min-h-screen">
      <PublicPageHero
        items={[{ label: 'Kalender' }]}
        title={`${MONTH_NAMES[month]} ${year}`}
        lead="Program dan Agenda publik IKMI Cirebon. Hanya kegiatan yang resmi dipublikasikan ditampilkan."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781225577/ChatGPT_Image_12_Jun_2026_07.49.13_wzkx4s.png"
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CalendarLegend />
          <CalendarFilters selectedType={eventType} />
          <Link
            href={`/kalender?year=${currentMonth.year}&month=${currentMonth.month}&date=${todayStr}${eventType === 'all' ? '' : `&type=${eventType}`}`}
            className="ikmi-button ikmi-button--secondary inline-flex min-h-11 items-center rounded-md px-3 text-xs font-bold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Hari ini
          </Link>
        </div>
      </PublicPageHero>

      <section className="public-page-content">
        <div className="public-container max-w-6xl">

        {/* Desktop: full month grid (hidden on mobile) */}
        <div className="hidden md:block">
          <DesktopCalendarGrid
            year={year}
            month={month}
            days={days}
            eventsByDate={eventsByDate}
            today={todayStr}
            selectedType={eventType}
          />
        </div>

        {/* Mobile: compact month + selected date list (hidden on md+) */}
        <div className="md:hidden">
          <MobileCalendar
            year={year}
            month={month}
            days={days}
            eventsByDate={eventsByDate}
            today={todayStr}
            selectedDate={selectedDate}
            selectedType={eventType}
          />
        </div>

        {/* Empty state for entire month */}
        {events.length === 0 && (
          <div className="mt-8 border-l-2 border-accent bg-surface py-6 pl-5">
            <p className="text-sm text-text-secondary">
              Tidak ada kegiatan publik pada {MONTH_NAMES[month]} {year}.
            </p>
          </div>
        )}
        </div>
      </section>
    </main>
  )
}
