import { prisma } from '@/core/database/prisma'
import { membershipService } from './services'

export const membershipQueries = {
  async getDashboardStats() {
    const registrations = await membershipService.getRegistrations()
    const members = await membershipService.getMembers()

    return {
      pendaftar: registrations.filter(r => r.status === 'PENDING').length,
      calonAnggota: registrations.filter(r => r.status === 'APPROVED').length,
      anggotaAktif: members.filter(m => m.isActive && !m.positionId && m.role.id !== 'alumni').length,
      pengurus: members.filter(m => m.isActive && m.positionId).length,
      demisioner: members.filter(m => !m.isActive && m.role.id !== 'alumni').length,
      alumni: members.filter(m => m.role.id === 'alumni').length
    }
  },

  async getMembersByPhase(phase: 'ACTIVE' | 'MANAGEMENT' | 'DEMISIONER' | 'ALUMNI') {
    const users = await membershipService.getMembers({ phase })
    // Get all registrations to map to users
    const registrations = await prisma.registration.findMany()
    const regMap = new Map()
    for (const r of registrations) {
      regMap.set(r.whatsapp, r)
    }

    return users.map(u => {
      const wa = u.email.split('@')[0]
      return {
        ...u,
        registration: regMap.get(wa) || null
      }
    })
  },

  async getRegistrationsByStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return membershipService.getRegistrations(status)
  },

  async getRegistrationProfile(registrationId: string) {
    return prisma.registration.findUnique({
      where: { id: registrationId }
    })
  },

  async getRegistrationLogs(registrationId: string) {
    return prisma.auditLog.findMany({
      where: {
        entity: 'Registration',
        entityId: registrationId
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  },

  async getMemberProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        department: true,
        position: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        }
      }
    })

    if (!user) return null

    let registration = null
    // Assuming email is whatsapp@ikmicirebon.or.id
    const wa = user.email.split('@')[0]
    if (wa) {
      registration = await prisma.registration.findFirst({
        where: { whatsapp: wa }
      })
    }

    return { user, registration }
  },

  async getMembershipAnalytics() {
    const totalUsers = await prisma.user.count({ where: { deletedAt: null } })
    const activeMembers = await prisma.user.count({ where: { isActive: true, deletedAt: null, positionId: null, role: { id: { not: 'alumni' } } } })
    const managementMembers = await prisma.user.count({ where: { isActive: true, deletedAt: null, positionId: { not: null } } })
    const alumniMembers = await prisma.user.count({ where: { deletedAt: null, role: { id: 'alumni' } } })
    
    const registrations = await prisma.registration.findMany({ where: { deletedAt: null } })
    const pendingReg = registrations.filter(r => r.status === 'PENDING').length
    const approvedReg = registrations.filter(r => r.status === 'APPROVED').length
    const rejectedReg = registrations.filter(r => r.status === 'REJECTED').length

    return {
      kpi: {
        totalUsers,
        activeMembers,
        managementMembers,
        alumniMembers,
        totalRegistrations: registrations.length,
        conversionRate: registrations.length > 0 ? (approvedReg / registrations.length) * 100 : 0
      },
      statusDistribution: [
        { name: 'Pending', value: pendingReg },
        { name: 'Approved', value: approvedReg },
        { name: 'Rejected', value: rejectedReg },
      ]
    }
  },

  async checkDataIntegrity() {
    const allUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true, position: true }
    })

    const usersWithoutRole = allUsers.filter(u => !u.roleId)
    const pengurusWithoutPosition = allUsers.filter(u => u.departmentId && !u.positionId)
    const activeWithPosition = allUsers.filter(u => u.isActive && u.positionId && !u.departmentId)
    const alumniWithoutRole = allUsers.filter(u => !u.isActive && !u.positionId && u.roleId !== 'alumni' && u.roleId !== 'anggota_departemen') // Demisioner vs Alumni check needs strict definition. Assuming alumni means role='alumni'
    
    // Duplicate membership based on name or email (simple check)
    const emails = allUsers.map(u => u.email)
    const duplicateEmails = emails.filter((e, i, a) => a.indexOf(e) !== i)
    const duplicates = allUsers.filter(u => duplicateEmails.includes(u.email))

    return {
      usersWithoutRole,
      pengurusWithoutPosition,
      activeWithPosition,
      alumniWithoutRole,
      duplicates
    }
  }
}
