import type { Metadata } from 'next'
import Image, { getImageProps } from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPublicProgramBySlug, programPlainText } from '@/features/public/public-program'
import { publicationPath } from '@/features/blog/publication-routes'
import { deriveProgramStatus, programStatusLabel, type ProgramDerivedStatus } from '@/features/programs/domain'
import { siteUrl } from '@/core/seo/site'
import { breadcrumbStructuredData, serializeStructuredData } from '@/core/seo/structured-data'
import { PublicPageHero } from '../../_components/public-page-hero'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function programStatusTone(status: ProgramDerivedStatus) {
  if (status === 'UPCOMING') return 'warning'
  if (status === 'ONGOING') return 'success'
  if (status === 'COMPLETED') return 'accent'
  if (status === 'CANCELLED' || status === 'POSTPONED') return 'danger'
  return 'surface'
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

function supportedImageUrl(value: string | null | undefined) {
  if (!value) return null
  if (value.startsWith('/')) return value
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' ? value : null
  } catch {
    return null
  }
}

function resolveProgramImages(program: Awaited<ReturnType<typeof getPublicProgramBySlug>>) {
  if (!program) return { desktop: null, mobile: null }
  const banner = program.homepageBanners[0]
  const fallback = program.posts.map((post) => supportedImageUrl(post.thumbnailUrl)).find(Boolean)
    ?? null
  const desktop = supportedImageUrl(banner?.desktopImage) ?? fallback
  const mobile = supportedImageUrl(banner?.mobileImage) ?? desktop
  return { desktop, mobile }
}

function ProgramHeroImage({ desktop, mobile, alt }: { desktop: string; mobile: string | null; alt: string }) {
  if (!mobile || mobile === desktop) {
    return <Image src={desktop} alt={alt} fill priority sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover" />
  }

  const shared = {
    alt,
    fill: true as const,
    sizes: '(max-width: 1200px) 100vw, 1200px',
    loading: 'eager' as const,
    fetchPriority: 'high' as const,
  }
  const { props: mobileProps } = getImageProps({ ...shared, src: mobile })
  const { props: desktopProps } = getImageProps({ ...shared, src: desktop })

  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={desktopProps.srcSet} sizes={desktopProps.sizes} />
      <img {...mobileProps} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const program = await getPublicProgramBySlug(slug)
  if (!program) return { title: 'Program Tidak Ditemukan', robots: { index: false, follow: false } }

  const url = `${siteUrl}/program/${program.slug}`
  const description = programPlainText(program.description).slice(0, 160) || 'Program IKMI Cirebon'
  const images = resolveProgramImages(program)

  return {
    title: program.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: program.name,
      description,
      url,
      type: 'article',
      ...(images.desktop ? { images: [{ url: images.desktop, alt: `Dokumentasi ${program.name}` }] } : {}),
    },
    twitter: {
      card: images.desktop ? 'summary_large_image' : 'summary',
      title: program.name,
      description,
      ...(images.desktop ? { images: [images.desktop] } : {}),
    },
  }
}

export default async function PublicProgramDetailPage({ params }: Props) {
  const { slug } = await params
  const program = await getPublicProgramBySlug(slug)
  if (!program) notFound()

  const status = deriveProgramStatus(program)
  const description = programPlainText(program.description)
  const objective = programPlainText(program.objective)
  const targetAudience = programPlainText(program.targetAudience)
  const output = programPlainText(program.output)
  const method = programPlainText(program.method)
  const images = resolveProgramImages(program)
  const jsonLd = serializeStructuredData({
    '@context': 'https://schema.org',
    '@graph': [breadcrumbStructuredData([
      { name: 'Beranda', path: '/' },
      { name: 'Program', path: '/program' },
      { name: program.name, path: `/program/${program.slug}` },
    ])],
  })

  return (
    <main className="public-page-root min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicPageHero
        items={[
          { label: 'Program', href: '/program' },
          { label: program.name },
        ]}
        title={program.name}
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781228245/ChatGPT_Image_12_Jun_2026_08.31.44_bnzje5.png"
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="break-words text-xs font-extrabold uppercase tracking-[0.13em] text-accent">
            {program.department.name}
          </span>
          <Badge tone={programStatusTone(status)}>
            {programStatusLabel(status)}
          </Badge>
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/85">
          {program.plannedStart ? (
            <span className="inline-flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                <time dateTime={program.plannedStart.toISOString()}>
                  {formatEventDate(program.plannedStart)}
                </time>
                {program.plannedEnd && program.plannedEnd.getTime() !== program.plannedStart.getTime() ? (
                  <>
                    <span aria-hidden="true"> — </span>
                    <time dateTime={program.plannedEnd.toISOString()}>
                      {formatEventDate(program.plannedEnd)}
                    </time>
                  </>
                ) : null}
              </span>
            </span>
          ) : (
            <span>Jadwal belum ditetapkan</span>
          )}
          {program.location ? (
            <span className="inline-flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="break-words">{program.location}</span>
            </span>
          ) : null}
        </div>
      </PublicPageHero>

      {images.desktop ? (
        <figure className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6 md:pt-10 lg:px-8">
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt sm:aspect-[16/8]">
            <ProgramHeroImage desktop={images.desktop} mobile={images.mobile} alt={`Dokumentasi ${program.name}`} />
          </div>
        </figure>
      ) : null}

      <article className="public-page-content">
        <div className="public-container max-w-4xl">
          {description ? (
            <section aria-labelledby="program-description-heading">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Tentang Program</p>
              <h2 id="program-description-heading" className="mt-2 font-heading text-2xl font-extrabold text-primary">Deskripsi</h2>
              <p className="mt-5 whitespace-pre-line break-words text-base leading-8 text-text-secondary">{description}</p>
            </section>
          ) : null}

          {objective ? (
            <section className="mt-12 border-t border-border pt-10" aria-labelledby="program-objective-heading">
              <h2 id="program-objective-heading" className="font-heading text-2xl font-extrabold text-primary">Tujuan Program</h2>
              <p className="mt-5 whitespace-pre-line break-words text-base leading-8 text-text-secondary">{objective}</p>
            </section>
          ) : null}

          {targetAudience || output ? (
            <div className="mt-12 grid gap-8 border-y border-border py-10 md:grid-cols-2">
              {targetAudience ? <section className="border-l-2 border-accent pl-5"><h2 className="font-heading text-lg font-extrabold text-primary">Sasaran</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-text-secondary">{targetAudience}</p></section> : null}
              {output ? <section className="border-l-2 border-accent pl-5"><h2 className="font-heading text-lg font-extrabold text-primary">Luaran</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-text-secondary">{output}</p></section> : null}
            </div>
          ) : null}

          {method ? (
            <section className="mt-12" aria-labelledby="program-method-heading">
              <h2 id="program-method-heading" className="font-heading text-2xl font-extrabold text-primary">Metode Pelaksanaan</h2>
              <p className="mt-5 whitespace-pre-line break-words text-base leading-8 text-text-secondary">{method}</p>
            </section>
          ) : null}

          {program.posts.length > 0 ? (
            <section className="mt-14 border-t border-border pt-10" aria-labelledby="program-related-heading">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Terhubung dengan Program</p>
              <h2 id="program-related-heading" className="mt-2 font-heading text-2xl font-extrabold text-primary">Konten terkait</h2>
              <div className="mt-6 divide-y divide-border border-y border-border">
                {program.posts.map((post) => (
                  <Link key={post.id} href={publicationPath(post.slug)} className="group grid min-w-0 gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className="min-w-0"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">{post.category.name}</span><span className="mt-1 block break-words font-heading text-lg font-extrabold text-primary group-hover:text-accent">{post.title}</span></span>
                    <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </main>
  )
}
