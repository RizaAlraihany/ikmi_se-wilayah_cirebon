import { prisma } from '@/core/database/prisma'

export const RBAC = {
  async hasPermission(userId: string, permission: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    })

    if (!user) return false
    
    // Super Admin override
    if (user.role.id === 'super_admin') return true

    return user.role.permissions.some(p => p.permission.name === permission || p.permission.id === permission)
  },

  async canManageKaderisasi(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, department: true }
    })

    if (!user) return false
    if (user.role.id === 'super_admin' || user.role.id === 'ketua_umum' || user.role.id === 'wakil_ketua_umum') return true

    // Check if user is Kadep / Sekdep of Kaderisasi
    if (
      user.department?.code === 'KAD' && 
      (user.role.id === 'ketua_departemen' || user.role.id === 'sekretaris_departemen')
    ) {
      return true
    }

    return false
  }
}
