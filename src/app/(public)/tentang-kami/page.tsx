import Image from 'next/image'
import { BookOpen, Sparkles, Heart, ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { webConfigQueries } from '@/features/web-config/queries'
import { defaultWebConfig } from '@/features/web-config/default-config'

export const metadata = {
  title: 'Tentang Kami - IKMI Cirebon',
  description: 'Sejarah, Visi, Misi, dan Nilai Organisasi IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

async function getConfig<T>(key: keyof typeof defaultWebConfig, fallback: T): Promise<T> {
  const config = await webConfigQueries.getWebConfigByKey(key)
  if (!config) return fallback
  try {
    return { ...fallback, ...JSON.parse(config.valueJson) }
  } catch {
    return fallback
  }
}

export default async function TentangPage() {
  const [landingAbout, aboutPage, cta] = await Promise.all([
    getConfig('landing_about', defaultWebConfig.landing_about),
    getConfig('about_page', defaultWebConfig.about_page),
    getConfig('landing_cta', defaultWebConfig.landing_cta),
  ])

  return (
    <main className="bg-background" id="tentang-page">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-10 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-accent md:mb-4 md:text-sm">
            Tentang IKMI
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            {landingAbout.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-relaxed">
            {landingAbout.description}
          </p>
        </div>
      </section>

      {/* ─── SEJARAH ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-8 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] items-center gap-6 md:gap-12 lg:grid-cols-2">
          <div className="relative flex aspect-[5/3] items-center justify-center overflow-hidden rounded-2xl bg-surface-alt md:aspect-[4/3]">
            <Image
              src="/ikmi-logo.png"
              alt="Sejarah IKMI"
              width={180}
              height={180}
              className="w-[130px] opacity-80 md:w-[180px]"
            />
            <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-surface md:bottom-6 md:right-6 md:px-4 md:py-2 md:text-xs">
              Est. 2020
            </span>
          </div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="font-heading text-2xl font-extrabold text-primary md:text-4xl">
              {aboutPage.historyTitle}
            </h2>
            <div className="space-y-3 text-sm leading-6 text-primary/70 md:space-y-4 md:text-base md:leading-[1.8]">
              <p>{aboutPage.history}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VISI & MISI ─────────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-8 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-4 md:gap-12 lg:grid-cols-2">
          {/* VISI */}
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-sm md:space-y-6 md:rounded-3xl md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-14 md:w-14 md:rounded-2xl">
              <Sparkles className="h-5 w-5 md:h-7 md:w-7" />
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-primary md:text-3xl">Visi</h2>
            <p className="text-sm leading-6 text-primary/70 md:text-base md:leading-[1.8]">
              {aboutPage.vision}
            </p>
          </div>

          {/* MISI */}
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-sm md:space-y-6 md:rounded-3xl md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent md:h-14 md:w-14 md:rounded-2xl">
              <BookOpen className="h-5 w-5 md:h-7 md:w-7" />
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-primary md:text-3xl">Misi</h2>
            <ul className="list-disc space-y-2.5 pl-5 text-sm leading-6 text-primary/70 md:space-y-4 md:text-base md:leading-[1.8]">
              {aboutPage.missions.map((mission) => (
                <li key={mission}>{mission}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── NILAI ORGANISASI ────────────────────────────────────────────── */}
      <section className="px-4 py-8 text-center md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-6 font-heading text-2xl font-extrabold text-primary md:mb-12 md:text-4xl">
            Nilai Organisasi
          </h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {aboutPage.values.map((nilai, idx) => {
              const Icon = idx === 0 ? Heart : idx === 1 ? BookOpen : Sparkles
              const tone = idx === 0 ? 'bg-accent/10 text-accent' : idx === 1 ? 'bg-primary/10 text-primary' : 'bg-success text-primary'
              return (
              <div key={idx} className="flex flex-col items-center gap-3 p-4 md:gap-4 md:p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full md:h-16 md:w-16 ${tone}`}>
                  <Icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="font-heading text-lg font-bold text-primary md:text-xl">{nilai.title}</h3>
                <p className="text-xs leading-5 text-muted md:text-sm md:leading-relaxed">{nilai.description}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-10 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-2xl font-extrabold text-surface md:text-5xl">
            {cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-relaxed">
            {cta.description}
          </p>
          <ButtonLink 
            href="/gabung" 
            className="mt-6 min-h-10 bg-surface px-6 py-2.5 text-sm !text-primary hover:bg-surface/90 md:mt-10 md:min-h-11 md:px-8 md:py-3 md:text-base"
          >
            Gabung Bersama IKMI
            <ArrowRight className="ml-1 h-4 w-4 md:ml-2 md:h-5 md:w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
