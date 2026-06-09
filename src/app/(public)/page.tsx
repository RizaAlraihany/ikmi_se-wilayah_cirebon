import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  HandHeart,
  Heart,
  Lightbulb,
  MapPin,
  Sparkles,
  Users,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/core/database/prisma'
import { KabinetSlider } from './_components/kabinet-slider'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { postQueries } from '@/features/blog/queries'

export const dynamic = 'force-dynamic'

const pillars = [
  {
    icon: Brain,
    title: 'Intelektual',
    description: 'Peningkatan kapasitas akademik dan riset.',
  },
  {
    icon: Users,
    title: 'Solidaritas',
    description: 'Membangun keluarga besar yang menguatkan.',
  },
  {
    icon: Lightbulb,
    title: 'Kearifan',
    description: 'Menjaga identitas dan nilai daerah.',
  },
  {
    icon: HandHeart,
    title: 'Kepedulian',
    description: 'Pengabdian langsung kepada masyarakat.',
  },
]

const galeriColors = [
  'from-blue-100 to-blue-200',
  'from-amber-100 to-amber-200',
  'from-green-100 to-green-200',
  'from-rose-100 to-rose-200',
]

function getToneForCategory(categorySlug: string): 'accent' | 'primary' | 'success' {
  if (categorySlug.includes('berita')) return 'accent'
  if (categorySlug.includes('opini')) return 'primary'
  return 'success'
}

function getGradientForCategory(categorySlug: string) {
  if (categorySlug.includes('berita')) return 'from-blue-50 to-blue-100'
  if (categorySlug.includes('opini')) return 'from-amber-50 to-amber-100'
  return 'from-green-50 to-green-100'
}

export default async function Home() {
  // Fetch Kabinet Data
  // As per design, showing some users from BPH / Kadep. We'll fetch 6 users with positions.
  const usersWithPositions = await prisma.user.findMany({
    where: { isActive: true, positionId: { not: null } },
    include: { position: { include: { department: true } } },
    take: 6,
    orderBy: { createdAt: 'asc' }, // usually Ketua Umum created first
  })

  const kabinet = usersWithPositions.map((u) => {
    const names = u.name.split(' ')
    const initials = names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0].slice(0, 2).toUpperCase()
    return {
      id: u.id,
      nama: u.name,
      jabatan: u.position?.name || 'Pengurus',
      kampus: 'IKMI Cirebon', // since campus isn't on User model, placeholder
      initials,
    }
  })

  // Fetch Agenda / Events (Upcoming)
  const events = await prisma.event.findMany({
    where: { status: 'UPCOMING', deletedAt: null },
    orderBy: { startDate: 'asc' },
    take: 3,
  })

  // Fetch Posts (Published)
  const posts = await postQueries.getPublishedPosts(3)

  // Fetch WebConfig
  const configKeys = ['landing_hero', 'landing_about', 'landing_cta'] as const
  type HomeConfigKey = (typeof configKeys)[number]
  const webConfigs = await prisma.webConfig.findMany({
    where: { key: { in: [...configKeys] }, deletedAt: null }
  })
  
  const getConfig = <K extends HomeConfigKey>(key: K): typeof defaultWebConfig[K] => {
    const config = webConfigs.find(c => c.key === key)
    if (!config) return defaultWebConfig[key]
    try {
      return { ...defaultWebConfig[key], ...JSON.parse(config.valueJson) }
    } catch {
      return defaultWebConfig[key]
    }
  }

  const heroConfig = getConfig('landing_hero')
  const aboutConfig = getConfig('landing_about')
  const ctaConfig = getConfig('landing_cta')

  return (
    <main className="bg-background text-primary" id="beranda">
      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-background px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24 lg:px-8"
        aria-labelledby="hero-heading"
      >
        {/* Decorative blob */}
        <div
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1200px]">
          {/* Label */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3 text-accent" aria-hidden="true" />
            IKMI Se-Wilayah Cirebon
          </span>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="font-heading max-w-3xl text-4xl font-extrabold leading-[1.15] text-primary sm:text-5xl md:text-6xl"
          >
            {heroConfig.title.split(',').length > 1 ? (
              <>
                {heroConfig.title.split(',')[0]}, <span className="text-accent">{heroConfig.title.split(',')[1]}</span>
              </>
            ) : (
              heroConfig.title
            )}
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-base font-medium leading-[1.8] text-primary/70 md:text-lg">
            {heroConfig.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href="/gabung"
              aria-label="Bergabung bersama IKMI"
            >
              Bergabung Bersama Kami
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink
              href="/tentang-kami"
              variant="secondary"
              aria-label="Jelajahi visi misi IKMI"
            >
              Jelajahi Visi Misi
            </ButtonLink>
          </div>

          {/* Stats Strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-line pt-8 sm:grid-cols-4">
            {heroConfig.stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="font-heading text-3xl font-extrabold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMPAT PILAR ─────────────────────────────────────────────────── */}
      <section
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="pilar-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 space-y-2 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Fondasi Organisasi
            </p>
            <h2
              id="pilar-heading"
              className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
            >
              Empat Pilar IKMI
            </h2>
          </div>

          {/* Desktop 4-col grid / Mobile horizontal swipe */}
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0"
            role="list"
            aria-label="Empat pilar organisasi IKMI"
          >
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                role="listitem"
                className="min-w-[240px] flex-shrink-0 snap-start md:min-w-0"
              >
                <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <pillar.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading text-xl font-bold text-primary">
                        {pillar.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {pillar.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TENTANG IKMI ────────────────────────────────────────────────── */}
      <section
        id="tentang"
        className="bg-background px-4 py-16 md:px-6 md:py-24 lg:px-8"
        aria-labelledby="tentang-heading"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          {/* Kiri: visual / ilustrasi */}
          <div
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-accent/10"
            aria-hidden="true"
          >
            <Image
              src="/ikmi-logo.png"
              alt="Logo IKMI Cirebon"
              width={180}
              height={180}
              className="opacity-80"
            />
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full border border-primary/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-full border border-accent/20" />
            </div>
            {/* Badge floating */}
            <span className="absolute bottom-6 right-6 rounded-full bg-primary px-4 py-2 text-xs font-bold text-surface">
              Est. 2020
            </span>
          </div>

          {/* Kanan: konten */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Tentang IKMI
              </p>
              <h2
                id="tentang-heading"
                className="font-heading text-4xl font-extrabold leading-tight text-primary md:text-5xl"
              >
                {aboutConfig.title}
              </h2>
            </div>

            <p className="text-base leading-[1.8] text-primary/70">
              {aboutConfig.description}
            </p>

            <div className="flex flex-wrap gap-3">
              {aboutConfig.badges.map((badge: string, i: number) => (
                <span key={i} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${i === 0 ? 'bg-accent/10 text-accent' : i === 1 ? 'bg-primary/8 text-primary' : 'bg-background-warm text-primary'}`}>
                  {i === 0 ? <Heart className="h-4 w-4" aria-hidden="true" /> : i === 1 ? <BookOpen className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {badge}
                </span>
              ))}
            </div>

            <Link
              href="/tentang-kami"
              className="inline-flex items-center gap-2 text-sm font-bold text-accent transition-colors hover:text-secondary"
              aria-label="Baca sejarah lengkap IKMI"
            >
              Baca Sejarah Lengkap IKMI
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FORMASI KABINET ─────────────────────────────────────────────── */}
      <section
        id="struktur"
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="kabinet-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Pengurus Pusat
              </p>
              <h2
                id="kabinet-heading"
                className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
              >
                Mengenal Lebih Dekat Kabinet{' '}
                <span className="text-accent">Sri Nawikasa</span>
              </h2>
            </div>
            <ButtonLink href="/struktur" variant="secondary">
              Lihat Seluruh Struktur Organisasi
            </ButtonLink>
          </div>

          <KabinetSlider kabinet={kabinet} />
        </div>
      </section>

      {/* ─── AKSI NYATA & AGENDA ─────────────────────────────────────────── */}
      <section
        id="agenda"
        className="bg-background px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="agenda-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Section header */}
          <div className="mb-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Jejak Langkah
            </p>
            <h2
              id="agenda-heading"
              className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
            >
              Aksi Nyata &amp; Agenda Kami
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-primary/70">
              Pantau terus pergerakan kami melalui program kerja unggulan dan
              kegiatan yang akan datang.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            {/* Kiri: List Agenda */}
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((agenda) => {
                  const date = new Date(agenda.startDate)
                  const day = date.getDate()
                  const month = date.toLocaleDateString('id-ID', { month: 'short' })
                  
                  return (
                    <div
                      key={agenda.id}
                      className="flex gap-5 rounded-2xl bg-surface p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-line transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/8 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted">
                          {month}
                        </span>
                        <span className="font-heading text-xl font-extrabold text-primary">
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Link href={`/event/${agenda.id}`} className="hover:text-accent">
                          <p className="font-heading text-base font-bold text-primary leading-snug">
                            {agenda.title}
                          </p>
                        </Link>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden="true" />
                          {agenda.location}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-muted text-sm italic">Belum ada agenda terdekat.</p>
              )}
              <ButtonLink
                href="/event"
                variant="secondary"
                className="mt-2 w-full justify-center"
                aria-label="Lihat kalender kegiatan lengkap"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Lihat Kalender Lengkap
              </ButtonLink>
            </div>

            {/* Kanan: Grid Galeri 2x2 */}
            <div
              className="grid grid-cols-2 gap-4"
              aria-label="Galeri dokumentasi kegiatan"
            >
              {galeriColors.map((gradient, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} ring-1 ring-line`}
                  aria-label={`Foto kegiatan ${i + 1}`}
                >
                  <div className="flex flex-col items-center gap-2 text-center opacity-40">
                    <CalendarDays className="h-8 w-8" aria-hidden="true" />
                    <span className="text-xs font-semibold">Dokumentasi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOG & RUANG GAGASAN ────────────────────────────────────────── */}
      <section
        id="blog"
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="blog-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Ruang Gagasan
              </p>
              <h2
                id="blog-heading"
                className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
              >
                Kabar &amp; Pemikiran Terbaru
              </h2>
            </div>
            <ButtonLink href="/blog" variant="secondary">
              Baca Semua Tulisan
            </ButtonLink>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {posts.length > 0 ? (
              posts.map((post) => {
                const dateStr = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Belum dipublikasi'
                
                return (
                  <Card
                    key={post.id}
                    className="overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                  >
                    {/* Thumbnail */}
                    {post.thumbnailUrl ? (
                      <div className="relative aspect-[16/9] w-full bg-muted/20">
                        <Image
                          src={post.thumbnailUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${getGradientForCategory(post.category.slug)}`}
                        aria-hidden="true"
                      >
                        <BookOpen className="h-10 w-10 text-primary/20" />
                      </div>
                    )}
                    <CardContent className="space-y-3 p-5">
                      <Badge tone={getToneForCategory(post.category.slug)}>
                        {post.category.name}
                      </Badge>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-heading text-base font-bold leading-snug text-primary hover:text-accent">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-sm leading-relaxed text-muted line-clamp-2">
                        {/* stripping tags if content is HTML is ideal, but let's just show a tiny bit or generic */}
                        {post.content.replace(/<[^>]+>/g, '')}
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        {dateStr}
                      </p>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <p className="text-muted text-sm italic col-span-3">Belum ada artikel.</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section
        className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-[1200px] text-center">
          <h2
            id="cta-heading"
            className="font-heading text-3xl font-extrabold text-surface md:text-5xl"
          >
            {ctaConfig.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-surface/75 md:text-lg">
            {ctaConfig.description}
          </p>
          <ButtonLink
            href="/gabung"
            className="mt-8 bg-surface !text-primary px-8 py-3 text-base hover:bg-surface/90"
            aria-label="Daftar menjadi anggota IKMI sekarang"
          >
            DAFTAR SEKARANG
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      {/* Mobile: Floating CTA bottom */}
      <div
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:hidden"
        aria-label="Tombol daftar anggota"
      >
        <ButtonLink
          href="/gabung"
          className="shadow-[0_8px_30px_rgba(0,23,105,0.35)]"
        >
          Daftar Anggota
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </main>
  )
}
