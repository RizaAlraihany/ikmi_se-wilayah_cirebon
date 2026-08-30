import type { Metadata } from 'next'
import Image from 'next/image'
import { IKMI_LOGO_URL } from '@/core/brand/assets'
import { getPamfletRequestFormOptions } from '@/features/request-pamflet/queries'
import { webConfigQueries } from '@/features/web-config/queries'
import { RequestPamfletForm } from './components/RequestPamfletForm'

export const metadata: Metadata = {
  title: 'Request Pamflet',
  description: 'Formulir resmi pengajuan desain dan publikasi kegiatan IKMI Cirebon.',
  alternates: { canonical: 'https://request.ikmicirebon.web.id' },
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RequestPamfletPage() {
  const [{ programs, agendas }, webConfig] = await Promise.all([
    getPamfletRequestFormOptions(),
    webConfigQueries.getMergedWebConfig(),
  ])

  return (
    <div className="public-tool-shell min-h-dvh bg-background">
      <header className="request-tool-header sticky top-0 z-20 border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src={IKMI_LOGO_URL} alt="Logo IKMI Cirebon" width={28} height={36} priority className="h-9 w-auto" />
            <div>
              <p className="font-heading text-sm font-bold text-primary">IKMI Cirebon</p>
              <p className="text-xs text-text-secondary">Layanan Komdigi</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-text-secondary">Tanpa login</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
        <div className="border-b border-border pb-7 md:pb-9">
          <p className="public-page-eyebrow">Form pengajuan resmi</p>
          <h1 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">Request Pamflet</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            Lengkapi informasi kegiatan dan bahan desain. Setelah tersimpan, Anda akan menerima nomor request untuk dicatat.
          </p>
        </div>

        <div className="py-7 md:py-9">
          <RequestPamfletForm programs={programs} agendas={agendas} />
        </div>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs leading-5 text-text-muted sm:px-6">
        Data digunakan oleh Admin Komdigi untuk memproses kebutuhan desain. Bantuan: {webConfig.contact_info?.email || 'ikmikominfo@gmail.com'}
      </footer>
    </div>
  )
}
