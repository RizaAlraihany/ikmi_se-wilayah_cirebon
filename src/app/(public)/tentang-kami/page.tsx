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
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4">
            Tentang IKMI
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            {landingAbout.title}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            {landingAbout.description}
          </p>
        </div>
      </section>

      {/* ─── SEJARAH ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-accent/10">
            <Image
              src="/ikmi-logo.png"
              alt="Sejarah IKMI"
              width={180}
              height={180}
              className="opacity-80"
            />
            <span className="absolute bottom-6 right-6 rounded-full bg-primary px-4 py-2 text-xs font-bold text-surface">
              Est. 2020
            </span>
          </div>
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-extrabold text-primary md:text-4xl">
              {aboutPage.historyTitle}
            </h2>
            <div className="space-y-4 text-base leading-[1.8] text-primary/70">
              <p>{aboutPage.history}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VISI & MISI ─────────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-2">
          {/* VISI */}
          <div className="space-y-6 bg-surface p-8 rounded-3xl shadow-sm border border-line">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-primary">Visi</h2>
            <p className="text-base leading-[1.8] text-primary/70">
              {aboutPage.vision}
            </p>
          </div>

          {/* MISI */}
          <div className="space-y-6 bg-surface p-8 rounded-3xl shadow-sm border border-line">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-primary">Misi</h2>
            <ul className="space-y-4 text-base leading-[1.8] text-primary/70 list-disc pl-5">
              {aboutPage.missions.map((mission) => (
                <li key={mission}>{mission}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── NILAI ORGANISASI ────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8 text-center">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-heading text-3xl font-extrabold text-primary md:text-4xl mb-12">
            Nilai Organisasi
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {aboutPage.values.map((nilai, idx) => {
              const Icon = idx === 0 ? Heart : idx === 1 ? BookOpen : Sparkles
              const tone = idx === 0 ? 'bg-accent/10 text-accent' : idx === 1 ? 'bg-primary/10 text-primary' : 'bg-success text-primary'
              return (
              <div key={idx} className="flex flex-col items-center gap-4 p-6">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl font-bold text-primary">{nilai.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{nilai.description}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-surface md:text-5xl">
            {cta.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/80 md:text-lg">
            {cta.description}
          </p>
          <ButtonLink 
            href="/gabung" 
            className="mt-10 bg-surface !text-primary hover:bg-surface/90 px-8 py-3 text-base"
          >
            Gabung Bersama IKMI
            <ArrowRight className="ml-2 h-5 w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
