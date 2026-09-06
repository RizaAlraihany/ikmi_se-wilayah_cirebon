import {
  agendaStatusLabel,
  deriveAgendaStatus,
  type AgendaDerivedStatus,
} from '@/features/agendas/domain'
import { getPublicAgendaOccurrences } from '@/features/public/public-agenda'
import { publicPlainText } from '@/features/public/public-text'

import { PublicPageHero } from '../_components/public-page-hero'
import { AgendaListingInteraction, type AgendaListingItem } from './agenda-listing-interaction'

function statusTone(status: AgendaDerivedStatus) {
  if (status === 'BERJALAN') return 'success'
  if (status === 'AKAN_DATANG') return 'warning'
  if (status === 'DIBATALKAN' || status === 'DITUNDA') return 'danger'
  if (status === 'SELESAI') return 'accent'
  return 'surface'
}

export async function AgendaListingPage() {
  const now = new Date()
  const agendas = await getPublicAgendaOccurrences(now)

  const items: AgendaListingItem[] = agendas.map((agenda) => {
    const status = deriveAgendaStatus({
      startDatetime: agenda.start,
      endDatetime: agenda.end,
      status: agenda.status,
      // Each expanded row is a concrete occurrence. Treat it as a fixed
      // instance so recurring/relative master metadata cannot override its
      // actual start/end status.
      scheduleType: 'FIXED_DATE',
    }, now)
    const dayParts = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' }).formatToParts(agenda.start)
    const timeFormatter = new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' })

    return {
      id: agenda.id,
      name: agenda.name,
      description: publicPlainText(agenda.description) || null,
      location: agenda.location,
      organizationalUnitName: agenda.organizationalUnitName,
      statusLabel: agendaStatusLabel(status),
      statusTone: statusTone(status),
      scheduleType: agenda.scheduleType,
      dayLabel: dayParts.filter((part) => part.type !== 'literal').map((part) => part.value).join(' '),
      yearLabel: new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(agenda.start),
      dateLabel: new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'Asia/Jakarta' }).format(agenda.start),
      timeLabel: `${timeFormatter.format(agenda.start)} WIB`,
      endTimeLabel: agenda.end ? `${timeFormatter.format(agenda.end)} WIB` : null,
      startDateTime: agenda.start.toISOString(),
      endDateTime: agenda.end?.toISOString() ?? null,
    }
  })

  return (
    <main className="public-page-root min-h-screen">
      <PublicPageHero
        items={[{ label: 'Agenda' }]}
        title="Agenda IKMI Cirebon"
        lead="Agenda publik diurutkan berdasarkan waktu agar rencana kegiatan mudah dipindai."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781225577/ChatGPT_Image_12_Jun_2026_07.49.13_wzkx4s.png"
      />
      <section className="public-page-content public-container" aria-label="Daftar Agenda">
        <AgendaListingInteraction items={items} />
      </section>
    </main>
  )
}
