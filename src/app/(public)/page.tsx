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
  Target,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { prisma } from '@/core/database/prisma'
import { KabinetSlider } from './_components/kabinet-slider'
import { HeroSlideshow } from './_components/hero-slideshow'
import { ScrollReveal } from './_components/scroll-reveal'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { postQueries } from '@/features/blog/queries'

export const dynamic = 'force-dynamic'



const pillarIcons = [Brain, Users, Lightbulb, HandHeart]

const publicPositionDepartmentNames: Record<string, string> = {
  HPM: 'HPM',
  KAJ: 'Kajian & Advokasi',
  KOMDIGI: 'Komdigi',
  PSDA: 'PSDA',
  EKRAF: 'Ekotif',
}

const structureDepartmentOrder = ['KAD', 'KAJ', 'PSDA', 'EKRAF', 'KOMDIGI', 'HPM']

const structurePositionOrder = new Map([
  ['ketum', 0],
  ['waketum', 1],
  ['sekum_1', 2],
  ['sekum_2', 3],
  ['bendum_1', 4],
  ['bendum_2', 5],
])

function publicPositionName(user: {
  position?: { id: string; name: string; department?: { code: string; name: string } | null } | null
}) {
  const departmentCode = user.position?.department?.code
  const departmentName = departmentCode ? publicPositionDepartmentNames[departmentCode] : undefined

  if (!departmentName || !user.position) return user.position?.name || 'Pengurus'

  if (user.position.id.startsWith('kadep_')) return `Ketua Departemen ${departmentName}`
  if (user.position.id.startsWith('sekdep_')) return `Sekretaris Departemen ${departmentName}`
  if (user.position.id.startsWith('anggota_')) return `Anggota Departemen ${departmentName}`

  return user.position.name || 'Pengurus'
}

function publicStructureSortValue(user: {
  position?: { id: string; department?: { code: string; name: string } | null } | null
}) {
  const bphOrder = user.position?.id ? structurePositionOrder.get(user.position.id) : undefined
  if (bphOrder !== undefined) return bphOrder

  const departmentCode = user.position?.department?.code ?? ''
  const departmentIndex = structureDepartmentOrder.indexOf(departmentCode)
  const normalizedDepartmentIndex =
    departmentIndex === -1 ? structureDepartmentOrder.length : departmentIndex
  let roleIndex = 2
  if (user.position?.id?.startsWith('kadep_')) roleIndex = 0
  else if (user.position?.id?.startsWith('sekdep_')) roleIndex = 1

  return 10 + normalizedDepartmentIndex * 10 + roleIndex
}

function getToneForCategory(categorySlug: string): 'accent' | 'primary' | 'success' {
  if (categorySlug.includes('berita')) return 'accent'
  if (categorySlug.includes('opini')) return 'primary'
  return 'success'
}

export default async function Home() {
  const usersWithPositions = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      positionId: { not: null },
    },
    include: { position: { include: { department: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const sortedUsersWithPositions = usersWithPositions.sort((a, b) => {
    const orderA = publicStructureSortValue(a)
    const orderB = publicStructureSortValue(b)
    if (orderA !== orderB) return orderA - orderB
    return (a.position?.name || '').localeCompare(b.position?.name || '', 'id-ID')
  })

  const kabinet = sortedUsersWithPositions.map((user) => {
    const names = user.name.split(' ')
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase()

    return {
      id: user.id,
      nama: user.name,
      jabatan: publicPositionName(user),
      kampus: 'IKMI Cirebon',
      initials,
      photoUrl: user.photoUrl,
    }
  })

  const events = await prisma.event.findMany({
    where: { status: 'UPCOMING', deletedAt: null },
    orderBy: { startDate: 'asc' },
    take: 4,
  })

  const posts = await postQueries.getPublishedPosts(3)

  const configKeys = ['landing_hero', 'landing_about', 'landing_sections', 'landing_cta'] as const
  type HomeConfigKey = (typeof configKeys)[number]
  const webConfigs = await prisma.webConfig.findMany({
    where: { key: { in: [...configKeys] }, deletedAt: null },
  })

  const getConfig = <K extends HomeConfigKey>(key: K): typeof defaultWebConfig[K] => {
    const config = webConfigs.find((item) => item.key === key)
    if (!config) return defaultWebConfig[key]
    try {
      return { ...defaultWebConfig[key], ...JSON.parse(config.valueJson) }
    } catch {
      return defaultWebConfig[key]
    }
  }

  const heroConfig = getConfig('landing_hero')
  const aboutConfig = getConfig('landing_about')
  const sectionsConfig = getConfig('landing_sections')
  const ctaConfig = getConfig('landing_cta')
  const [heroLead, heroRest] = heroConfig.title.split(',')

  return (
    <main className="text-primary" id="beranda">
      {/* Scroll reveal aktivator */}
      <ScrollReveal />

      {/* ==========================================
          HERO — Slideshow background + overlay
          ========================================== */}
      <HeroSlideshow slides={heroConfig.slides} departmentLogos={heroConfig.departmentLogos}>
        <div className="grid grid-cols-1 items-center gap-7 md:gap-12 lg:grid-cols-2">
          {/* Kiri: Teks & CTA */}
          <div className="space-y-4 md:space-y-6">
            {/* Eyebrow */}
            <span className="hero-eyebrow-animate inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/18 md:min-h-9 md:gap-2 md:px-4 md:py-1.5 md:text-xs">
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
              {heroConfig.eyebrow}
            </span>

            {/* Title */}
            <h1
              id="hero-heading"
              className="hero-title-animate font-heading max-w-3xl text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {heroRest ? (
                <>
                  {heroLead},{' '}
                  <span style={{ color: 'rgba(255,255,255,0.72)' }}>{heroRest.trim()}</span>
                </>
              ) : (
                heroConfig.title
              )}
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle-animate max-w-2xl text-sm font-medium leading-6 text-white/80 md:text-lg md:leading-8">
              {heroConfig.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-animate flex flex-col gap-2.5 sm:flex-row md:gap-3">
              <ButtonLink
                href={heroConfig.primaryCtaHref}
                className="btn-micro min-h-10 bg-white px-4 text-sm font-bold text-primary shadow-lg hover:bg-white/95 md:min-h-11 md:px-5"
              >
                {heroConfig.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                href={heroConfig.secondaryCtaHref}
                variant="outline"
                className="btn-micro min-h-10 border border-white/28 bg-white/10 px-4 text-sm font-semibold text-white ring-0 hover:bg-white/18 md:min-h-11 md:px-5"
              >
                {heroConfig.secondaryCtaLabel}
              </ButtonLink>
            </div>
          </div>

          {/* Kanan: GBH — Garis Besar Haluan (glass card) */}
          <div className="hero-cta-animate w-full rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/16 backdrop-blur-sm md:p-6 lg:justify-self-end lg:max-w-md">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white/60 md:mb-4 md:text-[11px]">
              {heroConfig.pillarsLabel}
            </p>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4" id="pilar-heading" aria-label="4 Pilar IKMI">
              {heroConfig.pillars.map((pillar, index) => {
                const Icon = pillarIcons[index % pillarIcons.length]
                return (
                <div
                  key={pillar.title}
                  className="group flex flex-col gap-2 rounded-xl bg-white/10 p-3 ring-1 ring-white/12 transition-all duration-200 hover:bg-white/18 hover:ring-white/24 md:gap-3 md:rounded-[14px] md:p-4"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white/90 md:h-10 md:w-10"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-heading text-xs font-bold text-white md:text-sm">{pillar.title}</p>
                    <p className="mt-0.5 text-[11px] leading-[1.35] text-white/60 md:mt-1 md:text-xs md:leading-[1.4]">{pillar.description}</p>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      </HeroSlideshow>


      {/* ==========================================
          TENTANG KAMI
          ========================================== */}
      <section
        id="tentang"
        className="bg-background px-4 py-8 sm:px-6 md:py-16 lg:px-8"
        aria-labelledby="tentang-heading"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-6 md:gap-12 lg:grid-cols-2">
          {/* Logo dengan float animation */}
          <div
            className="relative flex aspect-[5/3] items-center justify-center overflow-hidden rounded-2xl bg-surface-alt ring-1 ring-border md:aspect-[4/3]"
            data-reveal="left"
            aria-hidden="true"
          >
            <Image
              src={sectionsConfig.aboutImageUrl}
              alt={sectionsConfig.aboutImageAlt}
              width={150}
              height={150}
              className="logo-float w-[130px] opacity-90 md:w-[180px]"
            />
            <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white shadow-md md:bottom-5 md:right-5 md:px-4 md:py-2 md:text-xs">
              {sectionsConfig.aboutBadgeLabel}
            </span>
          </div>

          {/* Teks */}
          <div className="space-y-4 md:space-y-6" data-reveal="right">
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.aboutEyebrow}
              </p>
              <h2
                id="tentang-heading"
                className="font-heading text-xl font-extrabold leading-tight tracking-tight text-primary sm:text-3xl md:text-4xl lg:text-5xl"
                style={{ letterSpacing: '-0.01em' }}
              >
                {aboutConfig.title}
              </h2>
            </div>

            <p className="text-sm leading-6 text-text-secondary md:text-base md:leading-8">{aboutConfig.description}</p>

            <div className="flex flex-wrap gap-2">
              {aboutConfig.badges.map((badge: string, index: number) => {
                const Icon = index === 0 ? Heart : index === 1 ? BookOpen : Sparkles
                return (
                  <span
                    key={badge}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-border md:min-h-10 md:gap-2 md:px-4 md:py-2 md:text-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-accent md:h-4 md:w-4" aria-hidden="true" />
                    {badge}
                  </span>
                )
              })}
            </div>

            {/* CTA dengan underline animasi */}
            <Link
              href="/tentang-kami"
              className="link-underline text-xs font-bold text-accent transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:text-sm"
            >
              {sectionsConfig.aboutLinkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================
          PENGURUS — 5-layer center-focus slider
          ========================================== */}
      <section
        id="struktur"
        className="bg-surface-alt px-4 py-8 sm:px-6 md:py-16 lg:px-8"
        aria-labelledby="kabinet-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div
            className="mb-5 flex flex-col gap-3 md:mb-7 md:flex-row md:items-end md:justify-between md:gap-4"
            data-reveal
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.structureEyebrow}
              </p>
              <h2
                id="kabinet-heading"
                className="font-heading text-lg font-extrabold tracking-tight text-primary sm:text-2xl md:text-3xl"
              >
                {sectionsConfig.structureTitle}{' '}
                <span className="text-accent">{sectionsConfig.structureAccent}</span>
              </h2>
            </div>
            <ButtonLink href="/struktur" variant="secondary" className="btn-micro min-h-10 px-4 text-xs md:min-h-11 md:text-sm">
              {sectionsConfig.structureButtonLabel}
            </ButtonLink>
          </div>

          <KabinetSlider kabinet={kabinet} />
        </div>
      </section>

      {/* ==========================================
          AGENDA / EVENT
          ========================================== */}
      <section
        id="agenda"
        className="bg-background px-4 py-8 sm:px-6 md:py-16 lg:px-8"
        aria-labelledby="agenda-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 space-y-1.5 md:mb-10 md:space-y-2" data-reveal>
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
              {sectionsConfig.agendaEyebrow}
            </p>
            <h2
              id="agenda-heading"
              className="font-heading text-xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl"
            >
              {sectionsConfig.agendaTitle}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-text-secondary md:text-base md:leading-7">
              {sectionsConfig.agendaDescription}
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <div className="space-y-3" data-stagger>
              {events.length > 0 ? (
                events.map((agenda) => {
                  const date = new Date(agenda.startDate)
                  const day = date.getDate()
                  const month = date.toLocaleDateString('id-ID', { month: 'short' })

                  return (
                    <Link
                      key={agenda.id}
                      href={`/event/${agenda.id}`}
                      className="group flex min-h-[92px] gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)] ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:min-h-[112px] md:gap-4 md:p-4"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-surface-alt text-center md:h-14 md:w-14 md:rounded-2xl">
                        <span className="text-[9px] font-bold uppercase text-text-secondary md:text-[10px]">
                          {month}
                        </span>
                        <span className="font-heading text-lg font-extrabold text-primary md:text-xl">
                          {day}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-1.5 md:space-y-2">
                        {/* Status badge UPCOMING */}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                          <span className="status-dot-live h-1.5 w-1.5 rounded-full bg-success" />
                          {sectionsConfig.agendaStatusLabel}
                        </span>
                        <p className="font-heading text-sm font-bold leading-snug text-primary md:text-base">
                          {agenda.title}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary md:text-xs">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden="true" />
                          {agenda.location}
                        </p>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="rounded-2xl bg-surface p-5 text-sm italic text-text-secondary ring-1 ring-border">
                  {sectionsConfig.agendaEmptyText}
                </p>
              )}
              <ButtonLink
                href="/event"
                variant="secondary"
                className="btn-micro mt-1 min-h-10 w-full justify-center text-xs md:mt-2 md:min-h-11 md:text-sm"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {sectionsConfig.agendaButtonLabel}
              </ButtonLink>
            </div>

            {/* Galeri dokumentasi placeholder */}
            <div
              className="grid grid-cols-2 gap-2.5 md:gap-3"
              data-stagger
              aria-label="Galeri dokumentasi kegiatan"
            >
              {sectionsConfig.galleryImages.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-alt ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] md:rounded-2xl"
                  aria-label={item.label}
                >
                  {item.url ? (
                    <Image
                      src={item.url}
                      alt={item.label}
                      width={360}
                      height={360}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-text-secondary">
                      <CalendarDays className="h-6 w-6 text-accent md:h-8 md:w-8" aria-hidden="true" />
                      <span className="text-[11px] font-semibold md:text-xs">{sectionsConfig.galleryFallbackLabel}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          BLOG / ARTIKEL
          ========================================== */}
      <section
        id="blog"
        className="bg-surface-alt px-4 py-8 sm:px-6 md:py-16 lg:px-8"
        aria-labelledby="blog-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div
            className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4"
            data-reveal
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent md:text-xs">
                {sectionsConfig.blogEyebrow}
              </p>
              <h2
                id="blog-heading"
                className="font-heading text-xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl"
              >
                {sectionsConfig.blogTitle}
              </h2>
            </div>
            <ButtonLink href="/blog" variant="secondary" className="btn-micro min-h-10 px-4 text-xs md:min-h-11 md:text-sm">
              {sectionsConfig.blogButtonLabel}
            </ButtonLink>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-6" data-stagger>
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
                  <article
                    key={post.id}
                    className="group overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-[5px] hover:shadow-[var(--shadow-xl)]"
                  >
                    {/* Thumbnail */}
                    <div className="overflow-hidden">
                      {post.thumbnailUrl ? (
                        <div className="relative aspect-[16/9] w-full bg-surface-alt">
                          <Image
                            src={post.thumbnailUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/9] items-center justify-center bg-surface-alt transition-transform duration-500 group-hover:scale-[1.02]">
                          <BookOpen className="h-10 w-10 text-accent" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2.5 p-4 md:space-y-3 md:p-5">
                      <Badge tone={getToneForCategory(post.category.slug)}>
                        {post.category.name}
                      </Badge>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug text-primary transition-colors hover:text-accent md:text-base">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="line-clamp-2 text-xs leading-5 text-text-secondary md:line-clamp-3 md:text-sm md:leading-6">
                        {post.content.replace(/<[^>]+>/g, '')}
                      </p>

                      {/* Divider */}
                      <div className="h-px bg-border" />

                      {/* Meta */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                          IK
                        </div>
                        <span className="text-xs font-semibold text-text-muted">{dateStr}</span>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="col-span-3 rounded-2xl bg-surface p-5 text-sm italic text-text-secondary ring-1 ring-border">
                {sectionsConfig.blogEmptyText}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          CTA — mesh gradient background
          ========================================== */}
      <section
        className="relative overflow-hidden px-4 py-10 sm:px-6 md:py-16 lg:px-8"
        style={{ background: 'var(--mesh-hero)' }}
        aria-labelledby="cta-heading"
      >
        {/* Ornamen blob dekoratif */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(0,114,198,0.6), transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(4,69,133,0.7), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1200px] text-center" data-reveal="scale">
          <div className="mb-3 flex justify-center md:mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/20 md:gap-2 md:px-4 md:text-xs">
              <Target className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
              {sectionsConfig.ctaEyebrow}
            </span>
          </div>
          <h2
            id="cta-heading"
            className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {ctaConfig.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/72 md:mt-4 md:text-lg md:leading-7">
            {ctaConfig.description}
          </p>
          <ButtonLink
            href={sectionsConfig.ctaButtonHref}
            className="btn-micro mt-6 min-h-10 bg-white px-6 text-sm font-bold text-primary shadow-[var(--shadow-float)] hover:bg-white/95 md:mt-8 md:min-h-11 md:px-8"
          >
            {sectionsConfig.ctaButtonLabel}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
