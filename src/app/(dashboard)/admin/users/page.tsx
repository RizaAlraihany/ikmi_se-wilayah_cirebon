import { Plus, Search, Trash2, Edit, Users } from 'lucide-react'
import { userQueries } from '@/features/users/queries'
import { deleteUserAction } from '@/features/users/actions'
import { Button, ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const q = params.q || ''
  const { data: users, meta } = await userQueries.getPaginatedUsers(page, 10, q)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun, role, dan departemen pengurus IKMI Cirebon."
        action={<ButtonLink href="/admin/users/create"><Plus className="h-4 w-4" aria-hidden="true" />Tambah Pengguna</ButtonLink>}
      />

      <Card>
        <CardContent className="space-y-5 p-5">
          <form className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Cari nama atau email..." className="pl-11" aria-label="Cari pengguna" />
          </form>

          {users.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada pengguna" description="Pengguna yang dibuat akan muncul di sini lengkap dengan role dan departemennya." actionHref="/admin/users/create" actionLabel="Tambah Pengguna" />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl ring-1 ring-line md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background text-primary">
                    <tr>
                      {['Nama', 'Email', 'Role', 'Departemen', 'Status', 'Aksi'].map((head) => (
                        <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-4 font-semibold">{user.name}</td>
                        <td className="px-4 py-4 text-muted">{user.email}</td>
                        <td className="px-4 py-4"><Badge>{user.role?.name || '-'}</Badge></td>
                        <td className="px-4 py-4 text-muted">{user.department?.name || '-'}</td>
                        <td className="px-4 py-4"><Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Aktif' : 'Nonaktif'}</Badge></td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" aria-label={`Edit ${user.name}`}>
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <form action={async () => {
                              'use server'
                              await deleteUserAction(user.id)
                            }}>
                              <Button type="submit" variant="ghost" size="icon" aria-label={`Hapus ${user.name}`}>
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading font-bold">{user.name}</h3>
                          <p className="text-sm text-muted">{user.email}</p>
                        </div>
                        <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{user.role?.name || '-'}</Badge>
                        <Badge>{user.department?.name || '-'}</Badge>
                      </div>
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
      <span>Halaman {page} dari {totalPages || 1} ({total} data)</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1}>Sebelumnya</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages}>Berikutnya</Button>
      </div>
    </div>
  )
}
