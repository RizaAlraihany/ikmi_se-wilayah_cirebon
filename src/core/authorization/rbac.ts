import { prisma } from '../database/prisma'
import { isSuperAdminRole } from '../auth/roles'

export interface SessionUser {
  id: string
  roleId: string
  departmentId: string | null
  positionId: string | null
}

import { permissionCache } from '../cache/permission-cache'

const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes
const CACHE_NAMESPACE = 'rbac:v2'

/**
 * Checks if the user has the required permission.
 * Bypasses permission check if the user is a Super Admin.
 */
export async function can(permissionName: string, user: SessionUser | null | undefined): Promise<boolean> {
  if (!user) {
    return false
  }

  if (isSuperAdminRole(user.roleId)) {
    return true
  }

  const cacheKey = `${CACHE_NAMESPACE}:${user.roleId}:${permissionName}`
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
