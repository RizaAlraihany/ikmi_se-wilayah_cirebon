'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronDown, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Post = {
  id: string
  slug: string
  title: string
  content: string
  excerpt?: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  author: { name: string; position: string | null }
  category: { slug: string; name: string }
}

const fixedCategories = ['Semua', 'Berita', 'Opini', 'Artikel', 'Kajian']

function stripHtml(content: string) {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bhttps?:\/\/[^\s<]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPreview(post: Post) {
  return stripHtml(post.excerpt || post.content)
}

function formatDate(date: Date | null) {
  return date
    ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Belum dipublikasi'
}

export function BlogList({ initialPosts, initialCategory = 'Semua' }: { initialPosts: Post[]; initialCategory?: string }) {
  const normalizedInitialCategory = fixedCategories.find(
    (category) => category.toLocaleLowerCase('id-ID') === initialCategory.toLocaleLowerCase('id-ID'),
  ) ?? 'Semua'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(normalizedInitialCategory)

  const filteredPosts = initialPosts
    .filter((post) => {
      const query = searchQuery.trim().toLocaleLowerCase('id-ID')
      const categoryMatches = activeCategory === 'Semua'
        || post.category.name.toLocaleLowerCase('id-ID') === activeCategory.toLocaleLowerCase('id-ID')
      const searchMatches = !query
        || post.title.toLocaleLowerCase('id-ID').includes(query)
        || stripHtml(post.content).toLocaleLowerCase('id-ID').includes(query)
        || post.author.name.toLocaleLowerCase('id-ID').includes(query)
      return categoryMatches && searchMatches
    })
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0
      return rightTime - leftTime
    })

  const featuredPost = filteredPosts[0]
  const listPosts = filteredPosts.slice(1)

  return (
    <div className="publication-browser">
      <div className="publication-toolbar">
        <div className="publication-filter-control">
          <p className="publication-control-label">
            <span className="publication-filter-label-mobile">Kategori</span>
            <span className="publication-filter-label-desktop">Jelajahi kategori</span>
          </p>
          <span className="publication-category-select">
            <select
              aria-label="Filter kategori publikasi"
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
            >
              {fixedCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
          <div className="publication-tabs" role="group" aria-label="Filter publikasi">
            {fixedCategories.map((category) => (
              <button
                key={category}
                className={`publication-tab ${activeCategory === category ? 'is-active' : ''}`}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <label className="publication-search-control">
          <span className="publication-control-label">Cari dalam arsip</span>
          <span className="publication-search">
            <Search className="publication-search-icon" aria-hidden="true" />
            <input
              placeholder="Judul, isi, atau penulis"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </span>
        </label>
      </div>

      <div className="publication-result-meta" aria-live="polite">
        <p><strong>{filteredPosts.length}</strong> publikasi ditemukan</p>
        <span>{activeCategory === 'Semua' ? 'Semua kategori' : activeCategory}</span>
      </div>

      {featuredPost ? (
        <div className="publication-content-grid grid gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <article className="min-w-0 lg:col-span-7">
            <p className="publication-content-kicker">Pilihan terbaru</p>
            <Link className="publication-featured-card group block" href={`/publikasi/${featuredPost.category.slug}/${featuredPost.slug}`}>
              <div className="publication-featured-media relative aspect-[4/3] w-full overflow-hidden bg-surface-alt sm:aspect-[16/9]">
                {featuredPost.thumbnailUrl ? (
                  <Image
                    src={featuredPost.thumbnailUrl}
                    alt={featuredPost.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary">
                    <BookOpen className="h-12 w-12 text-accent" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="publication-featured-content">
                <span className="public-section-kicker">{featuredPost.category.name}</span>
                <h2 className="publication-card-title mt-2 font-heading text-2xl font-bold leading-tight text-textmain transition-colors group-hover:text-accent sm:text-3xl md:text-4xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-4 line-clamp-3 text-base leading-7 text-textsec">{getPreview(featuredPost)}</p>
                <div className="publication-featured-meta mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-5">
                  <p className="text-sm font-bold text-textmain">{featuredPost.author.name}</p>
                  <time className="text-xs text-textmuted" dateTime={featuredPost.publishedAt?.toISOString()}>
                    {formatDate(featuredPost.publishedAt)}
                  </time>
                </div>
                <span className="public-text-link publication-featured-action">
                  Baca publikasi
                  <ArrowRight aria-hidden="true" />
                </span>
              </div>
            </Link>
          </article>

          {listPosts.length > 0 ? (
            <div className="min-w-0 lg:col-span-5">
              <div className="publication-list-heading">
                <div>
                  <p className="public-section-kicker">Arsip terbaru</p>
                  <h2 className="!text-xl">Publikasi Lainnya</h2>
                </div>
                <p className="publication-list-summary">
                  Kabar, opini, artikel, dan kajian lain dari ruang gagasan IKMI.
                </p>
              </div>

              <div className="publication-list grid gap-0">
                {listPosts.map((post) => (
                  <Link key={post.id} className="publication-list-card group" href={`/publikasi/${post.category.slug}/${post.slug}`}>
                    <div className="publication-list-media relative shrink-0 overflow-hidden bg-surface-alt">
                      {post.thumbnailUrl ? (
                        <Image
                          src={post.thumbnailUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 112px, 92px"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary">
                          <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{post.category.name}</span>
                      <h3 className="publication-card-title mt-2 font-heading text-lg font-bold leading-snug text-textmain transition-colors group-hover:text-accent sm:text-xl">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-textsec">{getPreview(post)}</p>
                      <p className="mt-4 text-xs text-textmuted">{post.author.name} · {formatDate(post.publishedAt)}</p>
                    </div>
                    <span className="publication-list-card-action" aria-hidden="true">Baca <ArrowRight className="h-3.5 w-3.5" /></span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="public-empty-state publication-empty-state text-center" role="status">
          <FileText className="mx-auto h-8 w-8 text-textmuted" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-extrabold text-textmain">Tidak ada publikasi ditemukan</h2>
          <p className="mt-2 text-sm text-textsec">Ubah kata kunci atau filter kategori.</p>
          <Button variant="secondary" className="mt-5" onClick={() => { setSearchQuery(''); setActiveCategory('Semua') }}>
            Reset filter
          </Button>
        </div>
      )}
    </div>
  )
}
