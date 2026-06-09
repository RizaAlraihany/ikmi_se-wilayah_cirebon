import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { complaintQueries } from '@/features/complaints/queries'
import { complaintPolicies } from '@/features/complaints/policies'
import { ComplaintBoard } from './components/ComplaintBoard'

export const metadata = {
  title: 'Manajemen Aduan | IKMI Cirebon',
}

export default async function AdminComplaintsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const canManage = await complaintPolicies.canManage({
    id: session.user.id!,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId || '',
    positionId: null
  })

  if (!canManage) {
    redirect('/admin/dashboard')
  }

  // Load complaints
  const complaints = await complaintQueries.getComplaints(0, 100) // simplify without pagination for now

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-primary">Aduan Mahasiswa</h1>
          <p className="mt-1 text-sm text-muted">Kelola dan tindak lanjuti aduan yang masuk dari mahasiswa.</p>
        </div>
      </div>

      <ComplaintBoard initialComplaints={complaints} />
    </div>
  )
}
