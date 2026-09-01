import type { Metadata } from 'next'
import { AgendaListingPage } from '../agenda/agenda-listing-page'
import { siteUrl } from '@/core/seo/site'

export const metadata: Metadata = {
  title: 'Kegiatan IKMI Cirebon',
  description: 'Agenda kegiatan publik IKMI Cirebon yang dijadwalkan.',
  alternates: { canonical: `${siteUrl}/kegiatan` },
  openGraph: {
    title: 'Kegiatan IKMI Cirebon',
    description: 'Agenda kegiatan publik IKMI Cirebon yang dijadwalkan.',
    url: `${siteUrl}/kegiatan`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

/**
 * The existing Agenda listing is the current data-backed presentation for the
 * v5 Kegiatan route. Its dialog/sheet interaction is owned by ORG-001.
 */
export default AgendaListingPage
