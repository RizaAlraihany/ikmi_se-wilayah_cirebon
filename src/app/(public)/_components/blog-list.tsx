'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'

type Post = {
  id: string
  slug: string
  title: string
  content: string
  thumbnailUrl: string | null
  publishedAt: Date | null
  author: {
    name: string
    position: string | null
  }
  category: {
    slug: string
    name: string
  }
}

function getToneForCategory(categorySlug: string): 'accent' | 'primary' | 'success' {
  if (categorySlug.includes('berita')) return 'accent'
  if (categorySlug.includes('opini')) return 'primary'
  return 'success'
}

function stripHtml(content: string) {
  return content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
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

const fixedCategories = [
  'Semua',
  'Berita Kegiatan',
  'Opini',
  'Kajian Daerah',
  'Sastra',
  'Info Kampus',
]

const sortOptions = [
  { value: 'Terbaru', label: 'Terbaru' },
  { value: 'Terlama', label: 'Terlama' },
]

function ArticleImage({
  post,
  featured = false,
}: {
  post: Post
  featured?: boolean
}) {
  return (
    <div
      className={
        featured
          ? 'relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface-alt md:aspect-[1.5]'
          : 'relative aspect-[16/10] overflow-hidden bg-surface-alt'
      }
    >
      {post.thumbnailUrl ? (
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-10 w-10 text-accent" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
    </div>
  )
}

function AuthorMark({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-text-inverse">
      {getInitials(name)}
    </span>
  )
}

export function BlogList({
  initialPosts,
}: {
  initialPosts: Post[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [sortOrder, setSortOrder] = useState('Terbaru')

  const categoryCounts = initialPosts.reduce<Record<string, number>>((counts, post) => {
    counts[post.category.name] = (counts[post.category.name] ?? 0) + 1
    return counts
  }, {})

  const categoryOptions = fixedCategories.map((categoryName) => {
    const count =
      categoryName === 'Semua'
        ? initialPosts.length
        : categoryCounts[categoryName] ?? 0

    return {
      value: categoryName,
      label: `${categoryName === 'Semua' ? 'Semua Kategori' : categoryName} (${count})`,
    }
  })

  const filteredPosts = initialPosts
    .filter((post) => {
      const cleanContent = stripHtml(post.content).toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchCategory =
        activeCategory === 'Semua' || post.category.name === activeCategory
      const matchSearch =
        post.title.toLowerCase().includes(query) ||
        cleanContent.includes(query) ||
        post.author.name.toLowerCase().includes(query)

      return matchCategory && matchSearch
    })
    .sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return sortOrder === 'Terlama' ? timeA - timeB : timeB - timeA
    })

  const isFilterActive = activeCategory !== 'Semua' || searchQuery.trim() !== ''
  const featuredPost = !isFilterActive ? filteredPosts[0] : null
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts
  const sidebarPosts = initialPosts.slice(0, 4)

  return (
    <>
      <div className="relative z-10 -mt-8 mb-8 rounded-2xl bg-surface p-2.5 shadow-float ring-1 ring-border md:-mt-10 md:mb-10 md:rounded-full md:p-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
          <label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl bg-surface-alt px-3.5 md:min-h-12 md:rounded-full md:bg-transparent md:pl-4 md:pr-5">
            <Search className="h-4 w-4 shrink-0 text-text-secondary" />
            <Input
              type="text"
              placeholder="Cari kata kunci artikel atau penulis..."
              className="min-h-0 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-text-muted focus:border-transparent focus:ring-0"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <span className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />

          <div className="flex min-h-11 flex-1 items-center rounded-xl bg-surface-alt px-3.5 md:min-h-12 md:rounded-none md:bg-transparent md:px-5">
            <span className="mr-2 text-xs font-bold text-text-muted">Kategori:</span>
            <ListboxSelect
              value={activeCategory}
              aria-label="Pilih kategori artikel"
              options={categoryOptions}
              onValueChange={setActiveCategory}
              className="min-w-0 flex-1"
              triggerClassName="h-auto min-h-0 border-0 bg-transparent px-0 text-xs font-extrabold shadow-none hover:border-transparent focus:border-transparent focus:ring-0 md:text-sm"
              menuClassName="min-w-[15rem]"
            />
          </div>

          <span className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />

          <div className="flex min-h-11 flex-1 items-center rounded-xl bg-surface-alt px-3.5 md:min-h-12 md:rounded-none md:bg-transparent md:px-5">
            <span className="mr-2 text-xs font-bold text-text-muted">Urutkan:</span>
            <ListboxSelect
              value={sortOrder}
              aria-label="Urutkan artikel"
              options={sortOptions}
              onValueChange={setSortOrder}
              className="min-w-0 flex-1"
              triggerClassName="h-auto min-h-0 border-0 bg-transparent px-0 text-xs font-extrabold shadow-none hover:border-transparent focus:border-transparent focus:ring-0 md:text-sm"
              menuClassName="min-w-[13rem]"
            />
          </div>

          <Button
            type="button"
            className="min-h-11 rounded-xl px-6 text-xs font-extrabold uppercase tracking-wide md:min-h-12 md:rounded-full md:px-8"
          >
            Cari Artikel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <section className="space-y-8 lg:col-span-8">
          {filteredPosts.length > 0 ? (
            <>
              {featuredPost ? (
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group grid gap-6 rounded-3xl bg-surface p-5 shadow-soft transition-shadow hover:shadow-float md:grid-cols-12 md:items-center md:p-6"
                >
                  <div className="md:col-span-7">
                    <ArticleImage post={featuredPost} featured />
                  </div>

                  <div className="flex h-full flex-col justify-between text-left md:col-span-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getToneForCategory(featuredPost.category.slug)} className="min-h-6 rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-wide">
                          {featuredPost.category.name}
                        </Badge>
                        <span className="text-[10px] font-semibold text-text-muted">
                          {formatDate(featuredPost.publishedAt)}
                        </span>
                      </div>

                      <h2 className="font-heading text-lg font-extrabold leading-snug text-primary transition-colors group-hover:text-accent md:text-xl">
                        {featuredPost.title}
                      </h2>

                      <p className="line-clamp-3 text-xs leading-relaxed text-text-secondary">
                        {stripHtml(featuredPost.content)}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-surface-alt px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <AuthorMark name={featuredPost.author.name} />
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-primary">
                            {featuredPost.author.name}
                          </span>
                          <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            {featuredPost.author.position ?? 'Kontributor IKMI'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ) : null}

              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {gridPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-float"
                    >
                      <ArticleImage post={post} />

                      <div className="flex flex-grow flex-col space-y-3 p-5 text-left">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-text-muted">
                          <span>{formatDate(post.publishedAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            Rilis
                          </span>
                        </div>

                        <Badge tone={getToneForCategory(post.category.slug)} className="w-fit min-h-6 rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-wide">
                          {post.category.name}
                        </Badge>

                        <h3 className="font-heading text-base font-extrabold leading-snug text-primary transition-colors group-hover:text-accent">
                          {post.title}
                        </h3>

                        <p className="line-clamp-3 flex-grow text-xs leading-relaxed text-text-secondary">
                          {stripHtml(post.content)}
                        </p>

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <AuthorMark name={post.author.name} />
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-primary">
                                {post.author.name}
                              </span>
                              <span className="block truncate text-[10px] text-text-muted">
                                {post.author.position ?? 'Kontributor'}
                              </span>
                            </div>
                          </div>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-alt text-accent transition-colors group-hover:bg-primary group-hover:text-text-inverse">
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-3xl bg-surface px-4 py-16 text-center shadow-soft">
              <FileText className="mx-auto mb-3 h-9 w-9 text-text-muted" />
              <h3 className="mb-2 text-base font-bold text-primary">
                Tidak ada artikel ditemukan
              </h3>
              <p className="mx-auto max-w-sm text-sm text-text-secondary">
                Cobalah kata kunci lain atau ubah filter kategori.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('Semua')
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </section>

        <aside className="hidden space-y-6 lg:col-span-4 lg:block">
          <div className="rounded-3xl bg-surface p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              <Award className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Redaksi Portal
            </div>
            <h4 className="font-heading text-base font-extrabold text-primary">
              Dewan Redaksi IKMI Cirebon
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Kanal publikasi IKMI memuat kabar kegiatan, opini, kajian daerah, sastra, dan informasi kampus yang dikurasi untuk pembaca publik.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3 text-[11px] text-text-secondary">
              <span>Artikel tersedia</span>
              <span className="font-extrabold text-primary">{initialPosts.length}</span>
            </div>
          </div>

          <div className="rounded-3xl bg-surface p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Bacaan Terbaru
            </div>
            <div className="space-y-4">
              {sidebarPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4"
                >
                  <span className="shrink-0 font-heading text-2xl font-extrabold leading-none text-border transition-colors group-hover:text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-accent">
                      {post.category.name}
                    </span>
                    <h5 className="line-clamp-2 text-xs font-bold leading-snug text-primary transition-colors group-hover:text-accent">
                      {post.title}
                    </h5>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-primary p-6 text-text-inverse shadow-soft">
            <span className="inline-flex rounded-full bg-surface/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest">
              Kategori
            </span>
            <div className="mt-4 space-y-3">
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setActiveCategory(category.value)}
                  className="flex w-full items-center justify-between rounded-2xl bg-surface/10 px-4 py-3 text-left text-xs font-bold transition-colors hover:bg-surface/15"
                >
                  <span>{category.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
