import { Metadata } from 'next'
import { KirimTulisanForm } from './kirim-tulisan-form'
import { CheckCircle2 } from 'lucide-react'
import { siteUrl } from '@/core/seo/site'
import { PublicPageHero } from '../_components/public-page-hero'

export const metadata: Metadata = {
  title: 'Kirim Tulisan',
  description: 'Kirimkan opini, artikel, atau kajian Anda untuk dipublikasikan di website resmi IKMI Cirebon.',
  alternates: { canonical: `${siteUrl}/kirim-tulisan` },
  robots: { index: false, follow: false },
}

export default function KirimTulisanPage() {
  return (
    <main className="public-page-root min-h-screen">
      <PublicPageHero
        items={[{ label: 'Kirim Tulisan' }]}
        title="Kirim Tulisan"
        lead="Unggah opini, artikel, atau kajian dalam format DOCX/PDF. Prosesnya tanpa akun dan langsung masuk ke antrean editorial."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230548/psda_yufbw9.png"
      />

      <div className="public-page-content public-container grid max-w-5xl gap-8 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] md:gap-10">
        <div className="space-y-6">
          <div className="border-t-2 border-accent pt-5">
            <h2 className="font-heading text-lg font-bold text-primary">
              Sebelum mengunggah
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-foreground/80">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Format file yang didukung adalah <strong>DOCX</strong> atau <strong>PDF</strong>.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Ukuran maksimal file dokumen adalah <strong>10 MB</strong>.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Tulisan tidak mengandung unsur SARA dan tidak melanggar hukum.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Redaksi IKMI Cirebon berhak melakukan penyuntingan tanpa mengubah esensi isi tulisan.</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-heading text-lg font-bold text-primary">
              Proses editorial
            </h2>
            <p className="mt-2 text-sm text-muted">
              Setelah dikirim, tulisan Anda akan direview oleh pengurus / editor IKMI Cirebon.
              Jika disetujui, tulisan akan dipublikasikan di halaman publikasi web resmi.
            </p>
          </div>
        </div>

        <div>
          <KirimTulisanForm />
        </div>
      </div>
    </main>
  )
}
