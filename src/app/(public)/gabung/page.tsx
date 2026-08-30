import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import { PublicPageHero } from '../_components/public-page-hero'
import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Gabung Bersama IKMI Cirebon',
  description: 'Isi formulir untuk bergabung dan bertumbuh bersama keluarga besar IKMI Cirebon.',
  alternates: { canonical: 'https://ikmicirebon.web.id/gabung' },
}

const joiningNotes = [
  'Data digunakan untuk proses verifikasi keanggotaan.',
  'Mengisi formulir tidak membuat akun dashboard.',
  'Tim IKMI akan menghubungi Anda melalui WhatsApp.',
] as const

export default function JoinPage() {
  return (
    <main className="public-page-root text-primary">
      <PublicPageHero
        items={[{ label: 'Gabung Bersama Kami' }]}
        eyebrow="Keanggotaan IKMI Cirebon"
        title="Tumbuh, belajar, dan bergerak bersama."
        lead="Ceritakan sedikit tentang diri Anda. Data ini membantu pengurus mengenal dan menindaklanjuti minat bergabung Anda dengan tepat."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781228245/ChatGPT_Image_12_Jun_2026_08.31.44_bnzje5.png"
      />

      <section className="px-4 py-10 sm:px-6 md:py-16" aria-labelledby="join-form-title">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Sebelum mengisi</p>
            <h2 id="join-form-title" className="mt-3 font-heading text-2xl font-extrabold text-primary sm:text-3xl">
              Siapkan data diri Anda
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Isi dengan informasi yang dapat diverifikasi agar proses tindak lanjut berjalan lancar.
            </p>
            <ul className="mt-7 space-y-4 border-t border-border pt-6">
              {joiningNotes.map((note) => (
                <li key={note} className="flex gap-3 text-sm leading-6 text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </aside>

          <RegisterForm />
        </div>
      </section>
    </main>
  )
}
