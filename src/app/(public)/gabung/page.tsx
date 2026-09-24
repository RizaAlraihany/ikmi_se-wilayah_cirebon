import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import { PublicPageHero } from '../_components/public-page-hero'
import { RegisterForm } from './register-form'
import { webConfigQueries } from '@/features/web-config/queries'

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

export default async function JoinPage() {
  const pageHeroes = await webConfigQueries.getPublicPageHeroes()
  const gabungHero = pageHeroes.gabung

  return (
    <main className="public-page-root text-primary">
      <PublicPageHero
        className="join-page-hero"
        items={[{ label: 'Gabung Bersama Kami' }]}
        eyebrow="Keanggotaan IKMI Cirebon"
        title={gabungHero.title}
        lead={gabungHero.lead}
        image={gabungHero.imageUrl}
      />

      <section className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="join-form-title">
        <div className="mx-auto grid max-w-[1060px] gap-7 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Sebelum mengisi</p>
            <h2 id="join-form-title" className="mt-2 font-heading text-2xl font-extrabold text-balance text-primary sm:text-3xl">
              Siapkan data diri Anda
            </h2>
            <p className="mt-2 text-sm leading-6 text-pretty text-text-secondary">
              Isi dengan informasi yang dapat diverifikasi agar proses tindak lanjut berjalan lancar.
            </p>
            <ul className="mt-5 space-y-3 border-t border-border pt-4">
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
