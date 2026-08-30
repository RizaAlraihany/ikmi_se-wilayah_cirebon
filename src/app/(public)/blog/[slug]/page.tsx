import { notFound, permanentRedirect } from 'next/navigation'
import { postQueries } from '@/features/blog/queries'

export default async function LegacyBlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await postQueries.getPublishedPostBySlug(slug)
  if (!post) notFound()
  permanentRedirect(`/publikasi/${post.category.slug}/${post.slug}`)
}
