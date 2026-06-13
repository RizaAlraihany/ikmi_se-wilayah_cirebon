import Link from 'next/link'
import { Users } from 'lucide-react'
import { managementQueries } from '@/features/management/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export default async function ManagementPage() {
  const pengurus = await managementQueries.getPengurus(0, 100)

  // Kelompokkan per departemen
  const grouped = pengurus.reduce<Record<string, typeof pengurus>>(
    (acc, user) => {
      const key = user.department?.name ?? 'BPH / Tanpa Departemen'
      if (!acc[key]) acc[key] = []
      acc[key].push(user)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Manajemen Pengurus</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Data seluruh pengurus organisasi — BPH dan semua departemen (aktif & demisioner).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-alt px-4 py-2 text-sm font-semibold text-primary">
          <Users className="h-4 w-4 text-accent" aria-hidden="true" />
          Total: {pengurus.length} pengurus
        </div>
      </div>

      {pengurus.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Belum ada data pengurus"
            description="Data pengurus akan muncul di sini setelah diinput melalui sistem."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([departmentName, members]) => (
            <div key={departmentName}>
              <h2 className="mb-3 font-heading text-base font-bold text-text-secondary uppercase tracking-wide">
                {departmentName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {members.map((user) => (
                  <Link key={user.id} href={`/admin/management/${user.id}`}>
                    <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-card">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-card text-sm font-bold text-surface">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-primary truncate">{user.name}</p>
                          <p className="text-xs text-text-secondary truncate">
                            {user.position?.name ?? 'Tanpa Jabatan'}
                          </p>
                        </div>
                        <Badge
                          tone={user.isActive ? 'success' : 'surface'}
                          className="ml-auto flex-shrink-0"
                        >
                          {user.isActive ? 'Aktif' : 'Demisioner'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
