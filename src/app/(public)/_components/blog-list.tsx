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
  thumbnailUrl: string | null
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
      <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft md:mb-8 md:flex-row md:gap-4 md:p-4">
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0 scrollbar-hide">
          <div className="mr-2 flex items-center gap-2 text-text-secondary md:hidden">
            <Filter className="h-4 w-4" />
          </div>
          {allCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="min-h-9 whitespace-nowrap rounded-full px-3 text-xs md:min-h-11 md:px-4 md:text-sm"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary md:h-4 md:w-4" />
          <Input
            type="text"
            placeholder="Cari artikel..."
            className="min-h-10 rounded-full bg-surface-alt pl-8 text-sm md:min-h-11 md:pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-soft"
              >
                {post.thumbnailUrl ? (
                  <div className="relative aspect-[16/9] w-full bg-surface-alt">
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-surface-alt">
                    <BookOpen className="h-10 w-10 text-accent" aria-hidden="true" />
                  </div>
                )}
                <CardContent className="flex flex-grow flex-col space-y-2.5 p-4 md:space-y-3 md:p-5">
                  <Badge tone={getToneForCategory(post.category.slug)}>
                    {post.category.name}
                  </Badge>
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="font-heading flex-grow text-base font-bold leading-snug text-primary hover:text-accent md:text-lg">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="line-clamp-2 text-xs leading-5 text-text-secondary md:line-clamp-3 md:text-sm md:leading-relaxed">
                    {post.content.replace(/<[^>]+>/g, '')}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 md:pt-4">
                    <p className="text-[11px] font-semibold text-text-muted md:text-xs">{dateStr}</p>
                    <ButtonLink
                      variant="ghost"
                      size="sm"
                      className="min-h-9 px-2 text-xs text-accent hover:bg-accent/10 hover:text-accent md:min-h-11 md:text-sm"
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
        <div className="rounded-2xl border border-dashed border-border bg-surface-alt px-4 py-12 text-center md:rounded-3xl md:py-20">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-text-muted md:mb-4 md:h-12 md:w-12" />
          <h3 className="mb-2 text-base font-bold text-primary md:text-lg">
            Tidak ada artikel ditemukan
          </h3>
          <p className="text-sm text-text-secondary">Cobalah kata kunci lain atau ubah filter kategori.</p>
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
