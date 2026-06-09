import { BarChart3, FileText, PenLine, Send } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { postQueries } from '@/features/blog/queries'
import { can } from '@/core/authorization/rbac'

export const metadata = {
  title: 'CMS Analytics | IKMI Cirebon',
}

export default async function CmsAnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const currentUser = {
    id: session.user.id,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId,
    positionId: session.user.positionId,
  }
  const allowed = await can('cms.view', currentUser) || await can('post.view', currentUser)
  if (!allowed) redirect('/admin')

  const analytics = await postQueries.getAnalytics()

  const kpis = [
    { label: 'Total Posts', value: analytics.totalPosts, icon: FileText },
    { label: 'Published Posts', value: analytics.publishedPosts, icon: Send },
    { label: 'Draft Posts', value: analytics.draftPosts, icon: PenLine },
    { label: 'Publication Months', value: analytics.monthly.filter((item) => item.count > 0).length, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">CMS Analytics</h1>
        <p className="mt-1 text-sm text-muted">Pantau performa editorial berdasarkan kategori, author, dan bulan publikasi.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                <kpi.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">{kpi.label}</p>
                <p className="font-heading text-2xl font-extrabold text-primary">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Content By Category</h2>
            <div className="space-y-3">
              {analytics.byCategory.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold text-primary">{category.name}</span>
                  <Badge tone="accent">{category._count.posts}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Content By Author</h2>
            <div className="space-y-3">
              {analytics.byAuthor.map((author) => (
                <div key={author.id} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold text-primary">{author.name}</span>
                  <Badge tone="primary">{author._count.posts}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-lg font-bold text-primary">Monthly Publications</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {analytics.monthly.map((item) => (
              <div key={item.month} className="rounded-2xl bg-background p-4">
                <p className="text-sm font-semibold text-muted">{item.month}</p>
                <p className="mt-2 font-heading text-2xl font-extrabold text-primary">{item.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
