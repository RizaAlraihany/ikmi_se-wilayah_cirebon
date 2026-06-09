import { can } from '@/core/authorization/rbac'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'

export type CmsUser = NonNullable<Awaited<ReturnType<typeof getCmsUser>>>

export async function getCmsUser(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      isActive: true,
    },
    include: {
      role: true,
      department: true,
    },
  })
}

export function isSuperAdmin(user: { roleId: string }) {
  return user.roleId === 'super_admin'
}

export function isKomdigi(user: { department?: { code: string; name: string } | null }) {
  return user.department?.code === 'KOMDIGI' || !!user.department?.name.includes('Komunikasi & Digitalisasi')
}

export async function requireCmsUser(userId: string) {
  const user = await getCmsUser(userId)
  if (!user) {
    throw new NotFoundError('User tidak ditemukan atau tidak aktif.')
  }
  return user
}

export async function requirePermission(permission: string, userId: string) {
  const user = await requireCmsUser(userId)
  if (!(await can(permission, user)) && !isSuperAdmin(user)) {
    throw new ForbiddenError('Tidak memiliki izin untuk aksi ini.')
  }
  return user
}

export async function requireCmsUpdate(userId: string) {
  const user = await requirePermission('cms.update', userId)
  if (!isSuperAdmin(user) && !isKomdigi(user)) {
    throw new ForbiddenError('CMS hanya dapat dikelola oleh Departemen Komdigi.')
  }
  return user
}

export async function requirePublisher(userId: string) {
  const user = await requirePermission('post.publish', userId)
  if (!isSuperAdmin(user) && !isKomdigi(user)) {
    throw new ForbiddenError('Publish artikel hanya dapat dilakukan oleh Publisher Komdigi.')
  }
  return user
}
