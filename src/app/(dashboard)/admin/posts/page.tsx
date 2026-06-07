import { FileText, Plus, Search, Edit } from 'lucide-react'
import { postQueries } from '@/features/blog/queries'
import { Button, ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const q = params.q || ''
  const { data: posts, meta } = await postQueries.getPaginatedPosts(page, 10, q)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artikel & Publikasi"
        description="Kelola draft, review, dan publikasi resmi IKMI Cirebon."
        action={<ButtonLink href="/admin/posts/create"><Plus className="h-4 w-4" aria-hidden="true" />Tulis Artikel</ButtonLink>}
      />

      <Card>
        <CardContent className="space-y-5 p-5">
          <form className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Cari judul artikel..." className="pl-11" aria-label="Cari artikel" />
          </form>

          {posts.length === 0 ? (
            <EmptyState icon={FileText} title="Belum ada artikel" description="Draft dan publikasi yang dibuat departemen akan tampil di sini." actionHref="/admin/posts/create" actionLabel="Tulis Artikel" />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl ring-1 ring-line md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background">
                    <tr>
                      {['Judul', 'Penulis', 'Departemen', 'Status', 'Aksi'].map((head) => (
                        <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td className="px-4 py-4 font-semibold">{post.title}</td>
                        <td className="px-4 py-4 text-muted">{post.author?.name || '-'}</td>
                        <td className="px-4 py-4 text-muted">{post.author?.department?.name || '-'}</td>
                        <td className="px-4 py-4"><Badge tone={post.status === 'PUBLISHED' ? 'success' : 'warning'}>{post.status}</Badge></td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="icon" aria-label={`Edit ${post.title}`}>
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 md:hidden">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading font-bold">{post.title}</h3>
                        <Badge tone={post.status === 'PUBLISHED' ? 'success' : 'warning'}>{post.status}</Badge>
                      </div>
                      <p className="text-sm text-muted">{post.author?.name || '-'} - {post.author?.department?.name || '-'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

function Pagination({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>Halaman {page} dari {totalPages || 1} ({total} artikel)</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1}>Sebelumnya</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages}>Berikutnya</Button>
      </div>
    </div>
  )
}
