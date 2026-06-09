'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Search, ArrowRight, Filter } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

type Post = {
  id: string
  slug: string
  title: string
  content: string
  thumbnailUrl: string
  publishedAt: Date | null
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

function getGradientForCategory(categorySlug: string) {
  if (categorySlug.includes('berita')) return 'from-blue-50 to-blue-100'
  if (categorySlug.includes('opini')) return 'from-amber-50 to-amber-100'
  return 'from-green-50 to-green-100'
}

export function BlogList({
  initialPosts,
  categories,
}: {
  initialPosts: Post[]
  categories: { id: string; name: string }[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  const allCategories = ['Semua', ...categories.map((c) => c.name)]

  const filteredPosts = initialPosts.filter((post) => {
    const matchCategory =
      activeCategory === 'Semua' || post.category.name === activeCategory
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <>
      {/* Filter & Search Bar */}
      <div className="mb-10 flex flex-col md:flex-row justify-between gap-4 items-center bg-surface p-4 rounded-2xl shadow-sm border border-line">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 mr-2 text-muted md:hidden">
            <Filter className="h-4 w-4" />
          </div>
          {allCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Cari artikel..."
            className="pl-9 rounded-full bg-background-warm border-transparent focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Artikel */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
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
                className="overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] flex flex-col"
              >
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
                    className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${getGradientForCategory(
                      post.category.slug
                    )}`}
                    aria-hidden="true"
                  >
                    <BookOpen className="h-10 w-10 text-primary/20" />
                  </div>
                )}
                <CardContent className="space-y-3 p-5 flex flex-col flex-grow">
                  <Badge tone={getToneForCategory(post.category.slug)}>
                    {post.category.name}
                  </Badge>
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="font-heading text-lg font-bold leading-snug text-primary flex-grow hover:text-accent">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm leading-relaxed text-muted line-clamp-3">
                    {post.content.replace(/<[^>]+>/g, '')}
                  </p>
                  <div className="pt-4 mt-auto border-t border-line/50 flex justify-between items-center">
                    <p className="text-xs font-semibold text-muted">{dateStr}</p>
                    <ButtonLink
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-accent hover:text-accent hover:bg-accent/10"
                      href={`/blog/${post.slug}`}
                    >
                      Baca <ArrowRight className="ml-1 h-3 w-3" />
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-background-warm rounded-3xl border border-line border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-primary mb-2">
            Tidak ada artikel ditemukan
          </h3>
          <p className="text-muted">Cobalah kata kunci lain atau ubah filter kategori.</p>
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
    </>
  )
}
