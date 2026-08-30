import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { auth } from '@/core/auth/auth'
import { categoryQueries } from '@/features/categories/queries'
import { postQueries } from '@/features/blog/queries'
import { programQueries } from '@/features/programs/queries'
import { agendaQueries } from '@/features/agendas/queries'
import { PostForm } from '../create/post-form'
import { PostWorkflowActions } from './PostWorkflowActions'

export default async function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, post, categories, programs, agendas] = await Promise.all([
    auth(),
    postQueries.getPostForEdit(id),
    categoryQueries.getPublicationCategories(),
    programQueries.getPrograms(),
    agendaQueries.getAgendas(),
  ])

  if (!post) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/cms/posts" className="rounded-full p-2 text-primary hover:bg-primary/5" aria-label="Kembali ke daftar artikel">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-extrabold text-primary">Edit Artikel</h1>
            <Badge tone={post.status === 'PUBLISHED' ? 'success' : post.status === 'ARCHIVED' ? 'surface' : 'warning'}>{post.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{post.authorName || post.author.name} - {post.category.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-heading text-lg font-bold text-primary">Publication Workflow</h2>
          <PostWorkflowActions postId={post.id} status={post.status} />
        </CardContent>
      </Card>

      {post.writingSubmission ? <div className="flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wide text-accent">Sumber Karya Tulis</p><p className="mt-1 font-mono text-sm text-primary">{post.writingSubmission.submissionNumber}</p></div><ButtonLink href={`/api/private/karya-tulis/${post.writingSubmission.id}`} target="_blank" variant="secondary" size="sm"><FileText className="h-4 w-4" aria-hidden="true" />Buka Naskah Terbaru</ButtonLink></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <PostForm
              categories={categories.map((category) => ({ id: category.id, name: category.name }))}
              programs={programs.map(p => ({ id: p.id, name: p.name }))}
              agendas={agendas.map(a => ({ id: a.id, name: a.name }))}
              currentUserName={session?.user?.name}
              initialPost={{
                id: post.id,
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                thumbnailUrl: post.thumbnailUrl,
                thumbnailPublicId: post.thumbnailPublicId,
                ogImageUrl: post.ogImageUrl,
                ogImagePublicId: post.ogImagePublicId,
                categoryId: post.categoryId,
                authorName: post.authorName,
                seoTitle: post.seoTitle,
                seoDescription: post.seoDescription,
                seoKeywords: post.seoKeywords,
                programId: post.programId,
                agendaId: post.agendaId,
                status: post.status,
                scheduledAt: post.scheduledAt,
                revisionNotes: post.revisionNotes,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">Preview Post</h2>
              <p className="mt-1 text-sm text-muted">Tampilan ringkas sebelum artikel tayang di website publik.</p>
            </div>
            {post.thumbnailUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-background">
                <Image src={post.thumbnailUrl} alt={post.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div className="space-y-3">
              <Badge tone="accent">{post.category.name}</Badge>
              <h3 className="font-heading text-2xl font-extrabold text-primary">{post.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 180)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
