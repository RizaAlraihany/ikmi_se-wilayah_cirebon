import { can } from '@/core/authorization/rbac'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { isDashboardRole, isKomdigiAdminRole, isSuperAdminRole } from '@/core/auth/roles'

export type CmsUser = Awaited<ReturnType<typeof requireCmsUser>>

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

/** CMS authority follows the final dashboard role, not an organizational unit. */
export function isKomdigi(user: { roleId?: string | null }) {
  return isKomdigiAdminRole(user.roleId)
}

export async function requireCmsUser(userId: string) {
  const user = await getCmsUser(userId)
  if (!user || !isDashboardRole(user.roleId)) {
    throw new NotFoundError('User tidak ditemukan atau tidak aktif.')
  }
  return { ...user, roleId: user.roleId }
}

export async function requirePermission(permission: string, userId: string) {
  const user = await requireCmsUser(userId)
  if (!(await can(permission, user))) {
    throw new ForbiddenError('Tidak memiliki izin untuk aksi ini.')
  }
  return user
}

export async function requireCmsUpdate(userId: string) {
  const user = await requirePermission('cms.update', userId)
  if (!isSuperAdminRole(user.roleId) && !isKomdigi(user)) {
    throw new ForbiddenError('CMS hanya dapat dikelola oleh Admin Komdigi.')
  }
  return user
}

export async function requireCmsView(userId: string) {
  const user = await requirePermission('cms.view', userId)
  if (!isSuperAdminRole(user.roleId) && !isKomdigi(user)) {
    throw new ForbiddenError('CMS hanya dapat diakses oleh Admin Komdigi.')
  }
  return user
}

export async function requirePublisher(userId: string) {
  const user = await requirePermission('post.publish', userId)
  if (!isSuperAdminRole(user.roleId) && !isKomdigi(user)) {
    throw new ForbiddenError('Publish artikel hanya dapat dilakukan oleh Admin Komdigi.')
  }
  return user
}
