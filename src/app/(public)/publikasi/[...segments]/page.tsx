import { notFound, permanentRedirect } from 'next/navigation'

import { siteUrl } from '@/core/seo/site'
import { postQueries } from '@/features/blog/queries'
import { publicationPath } from '@/features/blog/publication-routes'

import { PublicationDetail } from '../publication-detail'

export const dynamic = 'force-dynamic'

type PublicationParams = { segments: string[] }

function publicationSlug(segments: string[]) {
  if (segments.length === 1) return segments[0]
  if (segments.length === 2) return segments[1]
  return null
}

export async function generateMetadata({ params }: { params: Promise<PublicationParams> }) {
  const { segments } = await params
  const slug = publicationSlug(segments)
  if (!slug) return { title: 'Publikasi Tidak Ditemukan', robots: { index: false, follow: false } }

  const post = await postQueries.getPublishedPostBySlug(slug)
  if (!post) return { title: 'Publikasi Tidak Ditemukan', robots: { index: false, follow: false } }

  const canonicalPath = publicationPath(post.slug)
  const description = post.seoDescription || post.excerpt || post.content.substring(0, 160).replace(/<[^>]+>/g, '')

  return {
    title: post.seoTitle || post.title,
    description,
    keywords: post.seoKeywords,
    openGraph: {
      title: post.seoTitle || post.title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName || post.author.name],
      images: post.ogImageUrl || post.thumbnailUrl ? [post.ogImageUrl || post.thumbnailUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description,
      images: post.ogImageUrl || post.thumbnailUrl ? [post.ogImageUrl || post.thumbnailUrl] : [],
    },
    alternates: { canonical: `${siteUrl}${canonicalPath}` },
  }
}

/**
 * Next App Router cannot register sibling dynamic segments named `[slug]` and
 * `[category]`. One segment is canonical; two segments retain legacy links.
 */
export default async function PublicationDetailRoute({ params }: { params: Promise<PublicationParams> }) {
  const { segments } = await params
  const slug = publicationSlug(segments)
  if (!slug) notFound()

  const post = await postQueries.getPublishedPostBySlug(slug)
  if (!post) notFound()

  if (segments.length === 2) return permanentRedirect(publicationPath(post.slug))

  const relatedPosts = (await postQueries.getPublishedPosts(6))
    .filter((item) => item.id !== post.id)
    .slice(0, 3)

  return <PublicationDetail post={post} relatedPosts={relatedPosts} />
}
