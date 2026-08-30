import { cache as reactCache } from 'react'
import { auth } from '@/core/auth/auth'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, UnauthorizedError } from '@/core/errors/custom-errors'
import { getDashboardRouteRequirement } from './dashboard-route-permissions'
import { can, type SessionUser } from './rbac'
import { isDashboardRole } from '@/core/auth/roles'
import { serializeAuditData } from '@/features/audit/audit-data'

export interface ActiveSessionUser extends SessionUser {
  sessionVersion: number
  name: string
  email: string
}

async function auditAuthorizationFailure(userId: string, permission: string, pathname?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'AUTHORIZATION_FAILED',
        entity: 'Authorization',
        entityId: permission,
        userId,
        newData: serializeAuditData({ permission, pathname }),
      },
    })
  } catch {
    // Audit storage tidak boleh menggagalkan request yang sudah ditolak.
  }
}

/** Mengambil user aktif dari database dengan memoization per-request */
export const requireActiveUser = reactCache(async (userId: string): Promise<ActiveSessionUser> => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      roleId: true,
      departmentId: true,
      positionId: true,
      sessionVersion: true,
      name: true,
      email: true,
    },
  })
  if (!user) {
    throw new UnauthorizedError('Akun tidak aktif atau tidak ditemukan.')
  }
  const roleId = user.roleId
  if (!isDashboardRole(roleId)) {
    throw new UnauthorizedError('Akun tidak aktif atau tidak ditemukan.')
  }
  return { ...user, roleId }
})

/** Menyelesaikan sesi ke user database aktif (hanya 1 query DB per request) */
export const requireAuth = reactCache(async (): Promise<ActiveSessionUser> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    throw new UnauthorizedError('Sesi tidak ditemukan atau telah berakhir.')
  }
  const activeUser = await requireActiveUser(userId)
  const sessionVersion = session.user.sessionVersion
  if (sessionVersion !== undefined && sessionVersion !== activeUser.sessionVersion) {
    throw new UnauthorizedError('Sesi tidak lagi valid.')
  }
  return activeUser
})

export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuth()
  return requirePermissionForUser(user, permission)
}

/** Pengecekan permission di level service layer */
export async function requirePermissionForUser(
  user: SessionUser | string,
  permission: string,
): Promise<SessionUser> {
  const activeUser = typeof user === 'string' ? await requireActiveUser(user) : await requireActiveUser(user.id)
  if (!(await can(permission, activeUser))) {
    await auditAuthorizationFailure(activeUser.id, permission)
    throw new ForbiddenError('Anda tidak memiliki izin untuk menjalankan aksi ini.')
  }
  return activeUser
}

export async function requireAnyPermission(permissions: readonly string[]): Promise<SessionUser> {
  const user = await requireAuth()
  for (const permission of permissions) {
    if (await can(permission, user)) return user
  }
  await auditAuthorizationFailure(user.id, permissions.join('|'))
  throw new ForbiddenError('Anda tidak memiliki izin untuk menjalankan aksi ini.')
}

/** Guard rute dashboard */
export async function requireDashboardRouteAccess(pathname: string): Promise<SessionUser> {
  const user = await requireAuth()
  const requirement = getDashboardRouteRequirement(pathname)
  if (!requirement) {
    await auditAuthorizationFailure(user.id, 'dashboard.route', pathname)
    throw new ForbiddenError('Route dashboard belum memiliki konfigurasi akses.')
  }
  if (!isDashboardRole(user.roleId)) {
    throw new ForbiddenError('Akun tidak memiliki akses dashboard.')
  }
  if (requirement.roles && !requirement.roles.includes(user.roleId)) {
    await auditAuthorizationFailure(user.id, requirement.permission ?? 'dashboard.role', pathname)
    throw new ForbiddenError('Role Anda tidak dapat mengakses area ini.')
  }
  if (requirement.permission) {
    await requirePermissionForUser(user, requirement.permission)
  }
  return { ...user, roleId: user.roleId }
}