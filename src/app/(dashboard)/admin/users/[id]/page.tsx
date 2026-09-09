import { notFound } from 'next/navigation'
import { requireSuperAdmin } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { userQueries } from '@/features/users/queries'
import { UserEditForm } from './user-edit-form'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params
  const [user, departments] = await Promise.all([
    prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, email: true, roleId: true, departmentId: true, isActive: true } }),
    userQueries.getDepartments(),
  ])
  if (!user) notFound()
  return <UserEditForm user={user} departments={departments.map(({ id, name }) => ({ id, name }))} />
}
