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
    <main className="bg-background min-h-screen pb-20">
      {/* ─── BREADCRUMB & HEADER ─────────────────────────────────────────── */}
      <section className="bg-primary px-4 pb-16 pt-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <ButtonLink 
            href="/blog" 
            variant="ghost" 
            className="mb-8 -ml-4 text-surface/70 hover:text-surface hover:bg-surface/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Blog
          </ButtonLink>
          
          <div className="space-y-6 text-center md:text-left">
            <Badge tone={getToneForCategory(post.category.slug)}>
              {post.category.name}
            </Badge>
            
            <h1 className="font-heading text-3xl font-extrabold text-surface sm:text-4xl md:text-5xl leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-surface/80 pt-4 border-t border-surface/10">
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
      <section className="px-4 py-12 md:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-[800px]">
          <div className="bg-surface rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-line space-y-10">
            
            {/* Thumbnail */}
            {post.thumbnailUrl && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted/20">
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
              className="prose prose-sm md:prose-base lg:prose-lg prose-primary max-w-none text-muted leading-relaxed
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
