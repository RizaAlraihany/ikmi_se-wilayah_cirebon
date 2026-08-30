import { prisma } from '@/core/database/prisma'
import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/core/authorization/guards'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { ForbiddenError } from '@/core/errors/custom-errors'
import { Badge } from '@/components/ui/badge'
import { AssignStructureForm } from './assign-structure-form'
import { RemoveAssignmentButton } from './remove-assignment-button'

export const metadata: Metadata = {
  title: 'Struktur Kepengurusan - Admin',
}

export default async function AdminStructurePage() {
  const actor = await requirePermission('structure.manage')
  if (!isOrganizationAdminRole(actor.roleId) && !isSuperAdminRole(actor.roleId)) {
    throw new ForbiddenError('Struktur organisasi hanya dapat dikelola oleh Admin Organisasi.')
  }

  const activePeriod = await prisma.period.findFirst({
    where: { status: 'ACTIVE' },
  })

  if (!activePeriod) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Struktur Kepengurusan</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Tidak ada periode aktif saat ini. Silakan aktifkan periode terlebih dahulu di menu Periode.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [assignments, departments, positions, users, members] = await Promise.all([
    prisma.structureAssignment.findMany({
      where: { periodId: activePeriod.id, deletedAt: null },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, photoUrl: true } },
        member: { select: { id: true, fullName: true, photoUrl: true } },
        department: { select: { id: true, name: true, unitType: true } },
        position: { select: { id: true, name: true } },
      },
      orderBy: [
        { department: { sortOrder: 'asc' } },
        { department: { name: 'asc' } },
        { position: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ]
    }),
    prisma.department.findMany({
      where: { periodId: activePeriod.id, status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.position.findMany({
      where: { deletedAt: null, department: { periodId: activePeriod.id, status: 'ACTIVE', deletedAt: null } },
      select: { id: true, name: true, departmentId: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.member.findMany({ where: { membershipStatus: 'ACTIVE_MEMBER', deletedAt: null }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Struktur Kepengurusan</h1>
          <p className="text-muted-foreground">Kelola struktur kepengurusan periode {activePeriod.name}</p>
        </div>
        <AssignStructureForm
          periodId={activePeriod.id}
          departments={departments}
          positions={positions}
          people={[...members.map((member) => ({ id: member.id, name: member.fullName, type: 'MEMBER' as const })), ...users.map((user) => ({ id: user.id, name: `${user.name} (akun admin legacy)`, type: 'USER' as const }))]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penugasan</CardTitle>
          <CardDescription>Menampilkan daftar pengurus yang ditugaskan pada periode aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Belum ada pengurus yang ditugaskan di periode ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {assignments.map((assignment) => (
                  <article key={assignment.id} className="space-y-3 rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{assignment.member?.fullName ?? assignment.user?.name ?? 'Data pengurus tidak tersedia'}</p>
                        <p className="text-sm text-muted-foreground">{assignment.position.name}</p>
                      </div>
                      <RemoveAssignmentButton assignmentId={assignment.id} memberName={assignment.member?.fullName ?? assignment.user?.name ?? 'Pengurus'} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{assignment.department.name}</span>
                      <Badge variant="outline" className="h-5 text-[10px]">{assignment.department.unitType}</Badge>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-md border md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pengurus</th>
                    <th className="px-4 py-3 font-medium">Unit / Departemen</th>
                    <th className="px-4 py-3 font-medium">Jabatan</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {(assignment.member?.fullName ?? assignment.user?.name ?? 'IK').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{assignment.member?.fullName ?? assignment.user?.name ?? 'Data tidak tersedia'}</p>
                            <p className="text-xs text-muted-foreground">{assignment.member ? 'Data anggota' : assignment.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-medium">{assignment.department.name}</span>
                          <Badge variant="outline" className="w-fit text-[10px] h-5">
                            {assignment.department.unitType}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">{assignment.position.name}</td>
                      <td className="px-4 py-3 text-right">
                        <RemoveAssignmentButton assignmentId={assignment.id} memberName={assignment.member?.fullName ?? assignment.user?.name ?? 'Pengurus'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
