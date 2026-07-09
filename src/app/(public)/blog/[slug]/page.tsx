import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { postQueries } from '@/features/blog/queries'
import { ArticleActionButtons } from './article-share-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await postQueries.getPublishedPostBySlug(slug)

  if (!post) {
    return { title: 'Artikel Tidak Ditemukan - IKMI Cirebon' }
  }

  return {
    title: `${post.title} - IKMI Cirebon`,
    description: post.seoDescription || post.excerpt || post.content.substring(0, 160).replace(/<[^>]+>/g, ''),
    keywords: post.seoKeywords,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || post.content.substring(0, 160).replace(/<[^>]+>/g, ''),
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
    },
  }
}

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

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await postQueries.getPublishedPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = (await postQueries.getPublishedPosts(6))
    .filter((item) => item.id !== post.id)
    .slice(0, 3)
  const dateStr = formatDate(post.publishedAt)
  const authorPosition = post.author.position?.name ?? 'Kontributor IKMI'

  return (
    <main className="min-h-screen bg-background">
      <section className="px-4 py-5 md:px-6 md:py-8 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-7 flex items-center justify-between gap-4">
            <ButtonLink
              href="/blog"
              variant="ghost"
              className="-ml-3 min-h-9 px-3 text-xs font-extrabold uppercase tracking-wide text-text-muted hover:text-primary md:min-h-10"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke Blog
            </ButtonLink>

            <div className="hidden items-center gap-3 text-xs font-bold uppercase tracking-wide text-text-muted sm:flex">
              <span>IKMI Press</span>
              <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" />
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-12 lg:items-start">
            <article className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  tone={getToneForCategory(post.category.slug)}
                  className="min-h-6 rounded-md px-3 py-1 text-[10px] uppercase tracking-widest"
                >
                  {post.category.name}
                </Badge>
                <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" />
                <span className="text-xs font-semibold text-text-muted">
                  Dipublikasi {dateStr}
                </span>
              </div>

              <h1 className="font-heading text-3xl font-extrabold leading-tight text-primary sm:text-4xl md:text-5xl">
                {post.title}
              </h1>

              {post.thumbnailUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-surface-alt sm:aspect-[21/9]">
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center rounded-3xl bg-surface-alt sm:aspect-[21/9]">
                  <BookOpen className="h-12 w-12 text-accent" aria-hidden="true" />
                </div>
              )}

              <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    {dateStr}
                  </span>
                  <span className="h-4 w-px bg-border" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4 text-text-muted" aria-hidden="true" />
                    {post.author.name}
                  </span>
                </div>

                <ArticleActionButtons title={post.title} />
              </div>

              <div
                className="prose prose-sm max-w-none leading-relaxed text-text-secondary md:prose-base lg:prose-lg
                  prose-headings:font-heading prose-headings:font-extrabold prose-headings:text-primary
                  prose-p:my-4 prose-p:text-text-secondary prose-a:text-accent hover:prose-a:text-primary
                  prose-strong:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-surface-alt prose-blockquote:text-primary
                  prose-li:text-text-secondary prose-img:rounded-2xl [&>*:first-child]:mt-0"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Publikasi Terverifikasi Komdigi IKMI
                </div>
                <ButtonLink
                  href="/blog"
                  variant="ghost"
                  className="min-h-9 px-0 text-xs font-extrabold uppercase tracking-wide text-primary hover:bg-transparent hover:text-accent"
                >
                  Halaman Depan Blog
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </article>

            <aside className="space-y-6 lg:col-span-4">
              <div className="rounded-3xl bg-surface p-6 ring-1 ring-border/70">
                <div className="mb-5 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  Tentang Penulis Artikel
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-text-inverse">
                    {getInitials(post.author.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-base font-extrabold text-primary">
                      {post.author.name}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-text-muted">
                      {authorPosition}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-text-secondary">
                  Penulis atau kontributor aktif kanal publikasi IKMI Se-Wilayah Cirebon.
                </p>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3 text-[11px] text-text-secondary">
                  <span>Afiliasi</span>
                  <span className="font-extrabold text-primary">IKMI Cirebon</span>
                </div>
              </div>

              {relatedPosts.length > 0 ? (
                <div className="rounded-3xl bg-surface p-6 ring-1 ring-border/70">
                  <div className="mb-5 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                    Rekomendasi Bacaan Lain
                  </div>

                  <div className="space-y-4">
                    {relatedPosts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/blog/${item.slug}`}
                        className="group flex items-start gap-3.5"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-accent">
                            {item.category.name}
                          </span>
                          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-primary transition-colors group-hover:text-accent">
                            {item.title}
                          </h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-3xl bg-primary p-6 text-text-inverse">
                <span className="inline-flex rounded-full bg-surface/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest">
                  Journal Newsroom
                </span>
                <h2 className="mt-4 font-heading text-base font-extrabold leading-snug">
                  Kanal publikasi resmi IKMI Cirebon
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-text-inverse/75">
                  Baca rilis, opini, dan kajian lain dari ruang gagasan IKMI.
                </p>
                <ButtonLink
                  href="/blog"
                  variant="secondary"
                  className="mt-5 min-h-10 bg-surface px-4 text-xs text-primary hover:bg-surface-alt"
                >
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
