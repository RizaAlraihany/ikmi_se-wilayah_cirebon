import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, User } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { postQueries } from '@/features/blog/queries'

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

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await postQueries.getPublishedPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Belum dipublikasi'

  function getToneForCategory(categorySlug: string): 'accent' | 'primary' | 'success' {
    if (categorySlug.includes('berita')) return 'accent'
    if (categorySlug.includes('opini')) return 'primary'
    return 'success'
  }

  return (
    <main className="min-h-screen bg-background pb-12 md:pb-20">
      {/* ─── BREADCRUMB & HEADER ─────────────────────────────────────────── */}
      <section className="bg-gradient-hero px-4 pb-10 pt-14 md:px-6 md:pb-16 md:pt-20 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <ButtonLink 
            href="/blog" 
            variant="ghost" 
            className="mb-5 min-h-9 px-3 text-xs text-surface/70 hover:bg-surface/10 hover:text-surface md:mb-8 md:-ml-4 md:min-h-11 md:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" /> Kembali ke Blog
          </ButtonLink>
          
          <div className="space-y-4 text-center md:space-y-6 md:text-left">
            <Badge tone={getToneForCategory(post.category.slug)}>
              {post.category.name}
            </Badge>
            
            <h1 className="font-heading text-2xl font-extrabold leading-tight text-surface sm:text-4xl md:text-5xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-surface/10 pt-3 text-xs text-surface/80 md:justify-start md:gap-4 md:pt-4 md:text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.name} {post.author.position ? `(${post.author.position.name})` : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THUMBNAIL & CONTENT ─────────────────────────────────────────── */}
      <section className="-mt-6 px-4 py-8 md:-mt-8 md:px-6 md:py-12 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <div className="space-y-6 rounded-2xl bg-surface p-4 shadow-card ring-1 ring-border md:space-y-10 md:p-10">
            
            {/* Thumbnail */}
            {post.thumbnailUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-alt md:rounded-2xl">
                <Image
                  src={post.thumbnailUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Rich Text Content */}
            <div 
              className="prose prose-sm max-w-none leading-relaxed text-text-secondary md:prose-base lg:prose-lg
                prose-headings:font-heading prose-headings:text-primary prose-headings:font-bold
                prose-a:text-accent hover:prose-a:text-primary prose-a:transition-colors
                prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

          </div>
        </div>
      </section>
    </main>
  )
}
