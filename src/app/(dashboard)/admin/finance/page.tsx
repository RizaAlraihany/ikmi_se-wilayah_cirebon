import { WalletCards } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { financeQueries } from '@/features/finance/queries'
import { userQueries } from '@/features/users/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { FinanceActions } from './components/FinanceActions'
import { can } from '@/core/authorization/rbac'

export default async function AdminFinancePage() {
  const session = await auth()
  const user = session?.user.id ? await userQueries.getUserById(session.user.id) : null
  const canApproveTier1 = await can('finance.approve_tier1', user)
  const canApproveTier2 = await can('finance.approve_tier2', user)
  const isGlobal = canApproveTier2
  const requests = await financeQueries.getRequests(isGlobal ? undefined : (user?.departmentId ?? undefined), 0, 20)

  const pending = requests.filter(r => r.status === 'PENDING')
  const approved = requests.filter(r => r.status === 'APPROVED_TIER1')
  const completed = requests.filter(r => r.status === 'COMPLETED')
  const rejected = requests.filter(r => r.status === 'REJECTED')

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Finance Approval" description="Pantau pengajuan dana, approval bendahara, dan status pencairan." />
        <Link href="/admin/finance/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Pengajuan Baru
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-warning">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Pending</p>
            <div className="text-2xl font-bold mt-1">{pending.length}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Approved Tier 1</p>
            <div className="text-2xl font-bold mt-1">{approved.length}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-success">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Disbursed (Completed)</p>
            <div className="text-2xl font-bold mt-1">{completed.length}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-danger">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Rejected</p>
            <div className="text-2xl font-bold mt-1">{rejected.length}</div>
          </CardContent>
        </Card>
      </div>

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
                    {request.status === 'COMPLETED' ? 'DISBURSED/CLOSED' : request.status === 'PENDING' ? 'REQUESTED' : request.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1 bg-muted/20 p-2 rounded border">
                  <div className="flex justify-between"><span>Requested:</span> <span>{new Date(request.createdAt).toLocaleDateString('id-ID')}</span></div>
                  {request.status === 'COMPLETED' && <div className="flex justify-between text-green-600 font-medium"><span>Disbursed:</span> <span>{new Date(request.updatedAt).toLocaleDateString('id-ID')}</span></div>}
                </div>
                <p className="font-heading text-3xl font-extrabold mt-4">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(request.amount))}
                </p>
                <p className="text-sm text-muted">Dokumen bukti: {request.proofUrl}</p>
                <FinanceActions 
                  requestId={request.id} 
                  status={request.status} 
                  canApproveTier1={canApproveTier1 && request.departmentId === user?.departmentId} 
                  canApproveTier2={canApproveTier2} 
                />
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
