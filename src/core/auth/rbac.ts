import { prisma } from '@/core/database/prisma'
import { isKomdigiAdminRole, isSuperAdminRole } from './roles'

export const RBAC = {
  async hasPermission(userId: string, permission: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    })

    if (!user) return false
    
    // Super Admin override
    if (isSuperAdminRole(user.role.id)) return true

    return user.role.permissions.some(p => p.permission.name === permission || p.permission.id === permission)
  },

  async canManageKomdigiContent(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, department: true }
    })

    if (!user) return false
    if (isSuperAdminRole(user.role.id)) return true

    return isKomdigiAdminRole(user.role.id) && user.department?.code === 'KOMDIGI'
  }
}
