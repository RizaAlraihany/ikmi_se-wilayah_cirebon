import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { userQueries } from '@/features/users/queries'
import { UserForm } from '../../../users/components/user-form'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminCreateUserPage() {
  const [roles, departments] = await Promise.all([
    userQueries.getRoles(),
    userQueries.getDepartments(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="rounded-full p-2 text-primary hover:bg-primary/5" aria-label="Kembali ke daftar pengguna">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Tambah Pengguna Baru</h1>
          <p className="mt-1 text-sm text-muted">Daftarkan akun pengurus dengan role dan departemen yang tepat.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <UserForm roles={roles} departments={departments} />
        </CardContent>
      </Card>
    </div>
  )
}
