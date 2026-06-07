import { WalletCards } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { financeQueries } from '@/features/finance/queries'
import { userQueries } from '@/features/users/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminFinancePage() {
  const session = await auth()
  const user = session?.user.id ? await userQueries.getUserById(session.user.id) : null
  const isGlobal = user?.roleId === 'super_admin' || user?.roleId === 'bph_bendum'
  const requests = await financeQueries.getRequests(isGlobal ? undefined : user?.departmentId, 0, 20)

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Approval" description="Pantau pengajuan dana, approval bendahara, dan status pencairan." />
      {requests.length === 0 ? (
        <Card>
          <EmptyState icon={WalletCards} title="Belum ada pengajuan dana" description="Pengajuan dana departemen akan tampil sebagai card review di halaman ini." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-muted">{request.department.name}</p>
                    <h3 className="font-heading text-xl font-bold">{request.description}</h3>
                  </div>
                  <Badge tone={request.status === 'COMPLETED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'}>
                    {request.status}
                  </Badge>
                </div>
                <p className="font-heading text-3xl font-extrabold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(request.amount))}
                </p>
                <p className="text-sm text-muted">Dokumen bukti: {request.proofUrl}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}
