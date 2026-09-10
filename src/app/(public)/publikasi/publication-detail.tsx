import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  User,
} from 'lucide-react'

import { ArticleRenderer } from '../_components/article-renderer'
import { PublicBreadcrumb } from '../_components/public-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { siteUrl } from '@/core/seo/site'
import { breadcrumbStructuredData, serializeStructuredData } from '@/core/seo/structured-data'
import { postQueries } from '@/features/blog/queries'
import { publicationPath } from '@/features/blog/publication-routes'
import { ArticleActionButtons } from './article-share-button'

type PublishedPost = NonNullable<Awaited<ReturnType<typeof postQueries.getPublishedPostBySlug>>>

function getToneForCategory(categorySlug: string): 'accent' | 'primary' | 'success' {
  if (categorySlug.includes('berita')) return 'accent'
  if (categorySlug.includes('opini')) return 'primary'
  return 'success'
}

function formatDate(date: Date | null) {
  if (!date) return 'Belum dipublikasi'

  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function PublicationDetail({ post, relatedPosts }: { post: PublishedPost; relatedPosts: PublishedPost[] }) {
  const dateStr = formatDate(post.publishedAt)
  const displayAuthor = post.authorName || post.author.name
  const authorPosition = post.author.position?.name ?? 'Kontributor IKMI'
  const canonicalPath = publicationPath(post.slug)
  const articleJsonLd = serializeStructuredData({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        mainEntityOfPage: `${siteUrl}${canonicalPath}`,
        headline: post.title,
        description: post.seoDescription || post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 160),
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        image: post.ogImageUrl || post.thumbnailUrl ? [post.ogImageUrl || post.thumbnailUrl] : undefined,
        author: { '@type': 'Person', name: displayAuthor },
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      breadcrumbStructuredData([
        { name: 'Beranda', path: '/' },
        { name: 'Publikasi', path: '/publikasi' },
        { name: post.category.name, path: `/publikasi?category=${post.category.slug}` },
        { name: post.title, path: canonicalPath },
      ]),
    ],
  })

  return (
    <main className="public-page-root min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd }} />
      <section className="public-page-content">
        <div className="public-container">
          <div className="mb-7 flex items-center justify-between gap-4">
            <PublicBreadcrumb
              items={[
                { label: 'Publikasi', href: '/publikasi' },
                { label: post.category.name, href: `/publikasi?category=${post.category.slug}` },
                { label: post.title },
              ]}
            />

            <div className="hidden items-center gap-3 text-xs font-bold uppercase tracking-wide text-text-muted sm:flex">
              <span>IKMI Press</span>
              <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" />
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-12 lg:items-start">
            <article className="space-y-5 lg:col-span-8 lg:max-w-[760px]">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={getToneForCategory(post.category.slug)} className="min-h-6 rounded-md px-3 py-1 text-[10px] uppercase tracking-widest">
                  {post.category.name}
                </Badge>
                <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" />
                <span className="text-xs font-semibold text-text-muted">Dipublikasi {dateStr}</span>
              </div>

              <h1 className="publication-detail-title font-heading text-3xl font-extrabold leading-tight text-primary sm:text-4xl md:text-5xl">
                {post.title}
              </h1>

              {post.excerpt ? <p className="text-base font-medium leading-7 text-text-secondary sm:text-lg sm:leading-8">{post.excerpt}</p> : null}

              <div className="flex flex-wrap items-center gap-4 border-y border-border py-4 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4 text-text-muted" aria-hidden="true" />{displayAuthor}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-text-muted" aria-hidden="true" />{dateStr}</span>
              </div>

              {post.thumbnailUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface-alt sm:aspect-[21/9]">
                  <Image src={post.thumbnailUrl} alt={post.title} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" priority />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-surface-alt sm:aspect-[21/9]">
                  <BookOpen className="h-12 w-12 text-accent" aria-hidden="true" />
                </div>
              )}

              <div className="flex justify-end border-b border-border pb-4">
                <ArticleActionButtons title={post.title} />
              </div>

              <ArticleRenderer content={post.content} title={post.title} coverImageUrl={post.thumbnailUrl} />

              <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Publikasi Terverifikasi Komdigi IKMI
                </div>
                <ButtonLink href="/publikasi" variant="ghost" className="min-h-11 px-0 text-xs font-extrabold uppercase tracking-wide text-primary hover:bg-transparent hover:text-accent">
                  Halaman Depan Blog
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </article>

            <aside className="space-y-6 lg:col-span-4">
              <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
                <div className="mb-5 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Tentang Penulis Artikel</div>
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-text-inverse">{getInitials(displayAuthor)}</span>
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-base font-extrabold text-primary">{displayAuthor}</h2>
                    <p className="mt-1 text-xs font-semibold text-text-muted">{authorPosition}</p>
                  </div>
                </div>
                <p className="mt-5 text-xs leading-relaxed text-text-secondary">Penulis atau kontributor aktif kanal publikasi IKMI Se-Wilayah Cirebon.</p>
                <div className="mt-5 flex items-center justify-between rounded-md bg-surface-alt px-4 py-3 text-[11px] text-text-secondary">
                  <span>Afiliasi</span>
                  <span className="font-extrabold text-primary">IKMI Cirebon</span>
                </div>
              </div>

              {relatedPosts.length > 0 ? (
                <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
                  <div className="mb-5 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Rekomendasi Bacaan Lain</div>
                  <div className="space-y-4">
                    {relatedPosts.map((item) => (
                      <Link key={item.id} href={publicationPath(item.slug)} className="group flex items-start gap-3.5">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
                          {item.thumbnailUrl ? (
                            <Image src={item.thumbnailUrl} alt={item.title} fill sizes="64px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><BookOpen className="h-5 w-5 text-accent" aria-hidden="true" /></div>
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-accent">{item.category.name}</span>
                          <h3 className="text-xs font-bold leading-snug text-primary transition-colors group-hover:text-accent">{item.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-lg bg-primary p-5 text-text-inverse shadow-card">
                <span className="inline-flex rounded-md bg-surface/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest">Journal Newsroom</span>
                <h2 className="mt-4 font-heading text-base font-extrabold leading-snug">Kanal publikasi resmi IKMI Cirebon</h2>
                <p className="mt-2 text-xs leading-relaxed text-text-inverse/75">Baca rilis, opini, dan kajian lain dari ruang gagasan IKMI.</p>
                <ButtonLink href="/publikasi" variant="secondary" className="mt-5 min-h-11 bg-surface px-4 text-xs text-primary hover:bg-surface-alt">
                  Lihat Semua Artikel
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
