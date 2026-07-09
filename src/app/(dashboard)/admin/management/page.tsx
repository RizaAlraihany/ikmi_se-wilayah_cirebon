import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
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
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-soft ring-1 ring-border lg:flex-row lg:items-end lg:justify-between">
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
                  <Link key={user.id} href={`/admin/management/${user.id}`} className="block">
                    <Card className="cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card">
                      <CardContent className="grid grid-cols-[auto_1fr] gap-3 p-4">
                        <div
                          className="row-span-2 flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-card bg-cover bg-center text-sm font-bold text-surface"
                          style={user.photoUrl ? { backgroundImage: `url(${user.photoUrl})` } : undefined}
                          aria-hidden="true"
                        >
                          {user.photoUrl ? null : user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-heading font-bold leading-tight text-primary">{user.name}</p>
                          <p className="mt-1 truncate text-xs text-text-secondary">
                            {user.position?.name ?? 'Tanpa Jabatan'}
                          </p>
                        </div>
                        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2">
                          <Badge
                            tone={user.isActive ? 'success' : 'surface'}
                            className="max-w-full shrink truncate px-2.5"
                          >
                            {user.isActive ? 'Aktif' : 'Demisioner'}
                          </Badge>
                          <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                        </div>
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
