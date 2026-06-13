import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import { managementQueries } from '@/features/management/queries'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { PengurusEditor } from './components/PengurusEditor'

export default async function EditPengurusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const sessionUser = session.user as {
    id: string
    roleId: string
    departmentId: string | null
    positionId: string | null
  }

  const isAuthorized = await can('user.update', {
    id: sessionUser.id,
    roleId: sessionUser.roleId,
    departmentId: sessionUser.departmentId,
    positionId: sessionUser.positionId,
  })

  if (!isAuthorized) redirect('/admin/management')

  const { id } = await params
  const [pengurus, departments, positions] = await Promise.all([
    managementQueries.getPengurusById(id),
    managementQueries.getDepartments(),
    managementQueries.getPositions(),
  ])

  if (!pengurus) notFound()

  return (
    <div className="space-y-5">
      <ButtonLink href="/admin/management" variant="ghost" className="w-fit px-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke pengurus
      </ButtonLink>

      <div className="rounded-3xl bg-gradient-card p-5 text-surface shadow-card md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge tone="surface" className="w-fit">
              {pengurus.isActive ? 'Pengurus Aktif' : 'Demisioner'}
            </Badge>
            <div>
              <h1 className="font-heading text-3xl font-extrabold leading-tight">Edit Pengurus</h1>
              <p className="mt-1 text-sm leading-6 text-surface/78">
                Perbarui data jabatan, departemen, dan status pengurus.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface/12 p-3 ring-1 ring-surface/15">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-sm font-extrabold">{pengurus.name}</p>
              <p className="text-xs text-surface/72">{pengurus.position?.name ?? 'Tanpa Jabatan'}</p>
            </div>
          </div>
        </div>
      </div>

      <PengurusEditor
        pengurus={{
          id: pengurus.id,
          name: pengurus.name,
          isActive: pengurus.isActive,
          departmentId: pengurus.departmentId,
          positionId: pengurus.positionId,
          whatsappNumber: pengurus.whatsappNumber,
          photoUrl: pengurus.photoUrl,
        }}
        departments={departments.map((department) => ({ id: department.id, name: department.name }))}
        positions={positions.map((position) => ({
          id: position.id,
          name: position.name,
          departmentId: position.departmentId,
        }))}
      />
    </div>
  )
}
