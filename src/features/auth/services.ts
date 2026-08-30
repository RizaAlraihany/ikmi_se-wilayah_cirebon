import { prisma } from '@/core/database/prisma'
import { serializeAuditData } from '@/features/audit/audit-data'

export const authService = {
  /**
   * Logs an authentication event and updates the user's last login time.
   */
  async logLoginEvent(userId: string) {
    await prisma.$transaction([
      // Update lastLoginAt
      prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      }),
      // Create Audit Log
      prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entity: 'User',
          entityId: userId,
          userId: userId,
        }
      })
    ])
  },

  async logLoginEventByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (user) {
      await authService.logLoginEvent(user.id)
    }
  },

  async logFailedLoginEvent(userId: string | null) {
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entity: 'Authentication',
        entityId: userId ?? 'anonymous',
        userId,
        newData: serializeAuditData({ reason: 'invalid_credentials' }),
      },
    })
  },

  /**
   * Logs a logout event.
   */
  async logLogoutEvent(userId: string) {
    await prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        userId: userId,
      }
    })
  }
}
