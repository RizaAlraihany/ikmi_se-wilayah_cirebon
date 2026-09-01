import { siteUrl } from '@/core/seo/site'
import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Agenda Organisasi',
  description: 'Daftar Agenda kegiatan publik IKMI Cirebon yang dijadwalkan.',
  alternates: { canonical: `${siteUrl}/agenda` },
  openGraph: {
    title: 'Agenda Organisasi IKMI Cirebon',
    description: 'Daftar Agenda kegiatan publik IKMI Cirebon yang dijadwalkan.',
    url: `${siteUrl}/agenda`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

/** Retain the former public URL while making /kegiatan the v5 entry point. */
export default function LegacyAgendaPage() {
  permanentRedirect('/kegiatan')
}
