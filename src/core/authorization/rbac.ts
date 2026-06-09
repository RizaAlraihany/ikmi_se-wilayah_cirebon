import { prisma } from '../database/prisma'

export interface SessionUser {
  id: string
  roleId: string
  departmentId: string | null
  positionId: string | null
}

import { permissionCache } from '../cache/permission-cache'

const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes

/**
 * Checks if the user has the required permission.
 * Bypasses permission check if the user is a Super Admin.
 */
export async function can(permissionName: string, user: SessionUser | null | undefined): Promise<boolean> {
  if (!user) {
    return false
  }

  // Super Admin bypass
  if (user.roleId === 'super_admin') {
    return true
  }

  const cacheKey = `${user.roleId}:${permissionName}`
  const cached = await permissionCache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  // Find if the role has the specific permission
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: user.roleId,
        permissionId: permissionName
      }
    }
  })

  const result = !!rolePermission

  await permissionCache.set(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}
