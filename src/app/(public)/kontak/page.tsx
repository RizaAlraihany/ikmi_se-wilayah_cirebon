import type { Metadata } from 'next'
import { ArrowRight, Check, Mail } from 'lucide-react'
import { siteUrl } from '@/core/seo/site'
import { webConfigQueries } from '@/features/web-config/queries'
import { GlobalPageHeader } from '../_components/global-page-header'

export const metadata: Metadata = {
  title: 'Kontak Resmi',
  description: 'Kontak resmi IKMI Se-Wilayah Cirebon.',
  alternates: { canonical: `${siteUrl}/kontak` },
  openGraph: {
    title: 'Kontak Resmi IKMI Cirebon',
    description: 'Kontak resmi IKMI Se-Wilayah Cirebon.',
    url: `${siteUrl}/kontak`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const messageChecklist = [
  'Gunakan subjek yang menjelaskan tujuan pesan.',
  'Cantumkan nama dan instansi bila mewakili organisasi.',
  'Lampirkan dokumen pendukung hanya jika memang diperlukan.',
]

export default async function ContactPage() {
  const [contact, pageHeroes] = await Promise.all([
    webConfigQueries.getPublicContactInfo(),
    webConfigQueries.getPublicPageHeroes(),
  ])
  const kontakHero = pageHeroes.kontak

  return (
    <main className="public-page-root contact-editorial" id="view-kontak">
      <GlobalPageHeader
        className="contact-page-header"
        items={[{ label: 'Kontak' }]}
        title={kontakHero.title}
        description={kontakHero.lead}
        image={kontakHero.imageUrl}
        aside={<div className="contact-official-channel">
            <p className="public-section-kicker">Kanal resmi organisasi</p>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="contact-official-link">
                <span className="contact-official-icon" aria-hidden="true">
                  <Mail />
                </span>
                <span>{contact.email}</span>
                <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <div className="contact-official-link" role="status">
                <span className="contact-official-icon" aria-hidden="true">
                  <Mail />
                </span>
                <span>Kontak resmi sedang diperbarui.</span>
              </div>
            )}
            <p>
              Satu alamat resmi agar setiap korespondensi tercatat dan dapat
              diarahkan kepada pengurus yang tepat.
            </p>
          </div>}
      />

      <section className="public-editorial-section" aria-labelledby="contact-guide-title">
        <div className="public-editorial-container contact-editorial-grid">
          <div className="contact-editorial-intro">
            <p className="public-section-kicker">Sebelum mengirim</p>
            <h2 id="contact-guide-title">Bantu kami memahami pesanmu sejak awal.</h2>
            <p>
              Pesan yang ringkas dan memiliki konteks lengkap lebih mudah
              diarahkan kepada pengurus yang tepat.
            </p>
          </div>

          <ul className="contact-message-list" aria-label="Panduan mengirim pesan">
            {messageChecklist.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" />
                <p>{item}</p>
              </li>
            ))}
          </ul>

          <aside className="contact-correspondence-scope">
            <p className="public-section-kicker">Cakupan korespondensi</p>
            <h2>Pesan yang dapat dikirim melalui kanal ini</h2>
            <ul>
              <li>Informasi organisasi dan kegiatan publik</li>
              <li>Undangan serta tawaran kolaborasi</li>
              <li>Korespondensi media dan publikasi</li>
            </ul>
            {contact.email ? (
              <a
                href={`mailto:${contact.email}?subject=Korespondensi%20untuk%20IKMI%20Cirebon`}
                className="public-text-link contact-compose-link"
              >
                Tulis email <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <p className="contact-compose-link">Email resmi belum dikonfigurasi.</p>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}
