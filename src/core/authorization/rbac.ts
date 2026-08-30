import { cache as reactCache } from 'react'
import { prisma } from '../database/prisma'
import { isSuperAdminRole } from '../auth/roles'
import { permissionCache } from '../cache/permission-cache'

export interface SessionUser {
  id: string
  roleId: string
  departmentId: string | null
  positionId: string | null
}

const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes
const CACHE_NAMESPACE = 'rbac:v2'

/**
 * Pengecekan hak akses permission untuk role pengguna.
 * Dilindungi React cache() untuk mencegah duplikasi query dalam 1 siklus render.
 */
async function checkPermission(permissionName: string, user: SessionUser | null | undefined): Promise<boolean> {
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

  // Cari apakah role memiliki permission spesifik
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: user.roleId,
        permissionId: permissionName,
      },
    },
  })

  const result = !!rolePermission

  await permissionCache.set(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}

export const can = reactCache(checkPermission)