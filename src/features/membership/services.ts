import { prisma } from '@/core/database/prisma'
import { NotFoundError, ForbiddenError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import type { Prisma } from '@prisma/client'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export type KaderisasiNotes = {
  interview?: string;
  administrasi?: string;
  followUp?: string;
};

export const membershipService = {
  /**
   * Mendapatkan daftar pendaftar (status = PENDING atau APPROVED)
   */
  async getRegistrations(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.registration.findMany({
      where: status ? { status, deletedAt: null } : { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * Mendapatkan seluruh anggota aktif, pengurus, demisioner, dan alumni
   */
  async getMembers(filter?: { phase?: 'ACTIVE' | 'MANAGEMENT' | 'DEMISIONER' | 'ALUMNI' }) {
    const whereClause: Prisma.UserWhereInput = { deletedAt: null }

    if (filter?.phase === 'ALUMNI') {
      whereClause.role = { id: 'alumni' }
    } else if (filter?.phase === 'DEMISIONER') {
      whereClause.isActive = false
      whereClause.role = { id: { not: 'alumni' } }
    } else if (filter?.phase === 'MANAGEMENT') {
      whereClause.isActive = true
      whereClause.positionId = { not: null }
    } else if (filter?.phase === 'ACTIVE') {
      whereClause.isActive = true
      whereClause.positionId = null
      whereClause.role = { id: { not: 'alumni' } }
    }

    return prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        position: true,
        department: true
      },
      orderBy: { name: 'asc' }
    })
  },

  /**
   * Verifikasi Pendaftar (Kaderisasi)
   */
  async verifyRegistration(id: string, status: 'APPROVED' | 'REJECTED', notes: KaderisasiNotes, adminId: string) {
    const registration = await prisma.registration.findUnique({ where: { id } })
    if (!registration) {
      throw new NotFoundError('Pendaftar tidak ditemukan')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.registration.update({
        where: { id },
        data: { status }
      })

      // Catat di AuditLog termasuk notes kaderisasi
      const newData = {
        status: updated.status,
        notes
      }

      await tx.auditLog.create({
        data: {
          action: 'VERIFY',
          entity: 'Registration',
          entityId: updated.id,
          userId: adminId,
          oldData: JSON.stringify({ status: registration.status }),
          newData: JSON.stringify(newData)
        }
      })

      if (status === 'APPROVED') {
        await eventBus.emit('registration.approved', { registrationId: updated.id })
      } else {
        await eventBus.emit('registration.rejected', { registrationId: updated.id })
      }

      return updated
    })
  },

  /**
   * Menambahkan/Mengedit Catatan Kaderisasi
   */
  async addKaderisasiNote(registrationId: string, noteType: string, content: string, adminId: string) {
    const registration = await prisma.registration.findUnique({ where: { id: registrationId } })
    if (!registration) {
      throw new NotFoundError('Pendaftar tidak ditemukan')
    }

    return prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Registration',
        entityId: registration.id,
        userId: adminId,
        newData: JSON.stringify({
          type: 'NOTE',
          noteType,
          content,
          message: `Added ${noteType} note`
        })
      }
    })
  },

  /**
   * Promosi Calon Anggota (APPROVED Registration) -> Anggota Aktif (User)
   */
  async promoteToActive(registrationId: string, adminId: string) {
    const registration = await prisma.registration.findUnique({ where: { id: registrationId } })
    if (!registration) {
      throw new NotFoundError('Pendaftar tidak ditemukan')
    }
    if (registration.status !== 'APPROVED') {
      throw new Error('Hanya pendaftar yang sudah disetujui yang dapat dipromosikan')
    }

    // Cek apakah user sudah dibuat dengan email/WA ini
    // Registration tidak punya email, kita gunakan nama dan kampus untuk sementara,
    // Di real-case, email pendaftar harus ada. Untuk sekarang kita buat dummy email jika tidak ada.
    const email = `${registration.whatsapp}@ikmicirebon.or.id`
    
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('Anggota sudah terdaftar sebagai user')
    }

    const user = await prisma.$transaction(async (tx: TxClient) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: registration.fullName,
          email,
          passwordHash: 'dummy_hash_to_be_reset', // Harus reset password nanti
          isActive: true,
          roleId: 'anggota_departemen', // Default
          createdBy: adminId
        }
      })

      // Log
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'User',
          entityId: user.id,
          userId: adminId,
          newData: JSON.stringify({ sourceRegistrationId: registration.id, message: 'Promoted to Active Member' })
        }
      })

      return user
    })

    await eventBus.emit('member.activated', { userId: user.id, registrationId })
    return user
  },

  /**
   * Promosi Anggota Aktif -> Pengurus
   */
  async promoteToManagement(userId: string, positionId: string, departmentId: string, adminId: string) {
    if (userId === adminId) {
      throw new ForbiddenError('Tidak dapat mempromosikan diri sendiri')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User tidak ditemukan')

    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          positionId,
          departmentId,
          updatedBy: adminId
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          entityId: user.id,
          userId: adminId,
          oldData: JSON.stringify({ positionId: user.positionId, departmentId: user.departmentId }),
          newData: JSON.stringify({ positionId, departmentId, message: 'Promoted to Management' })
        }
      })

      return updated
    })

    await eventBus.emit('member.promoted.management', { userId, departmentId, positionId })
    return updated
  },

  /**
   * Pengurus -> Demisioner
   */
  async demoteToDemisioner(userId: string, adminId: string) {
    if (userId === adminId) throw new ForbiddenError('Tidak dapat mengubah status diri sendiri')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User tidak ditemukan')

    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false, // Menandakan demisioner (inactive tp bukan alumni)
          updatedBy: adminId
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          entityId: user.id,
          userId: adminId,
          oldData: JSON.stringify({ isActive: user.isActive }),
          newData: JSON.stringify({ isActive: false, message: 'Demoted to Demisioner' })
        }
      })

      return updated
    })

    await eventBus.emit('member.demisioner', { userId })
    return updated
  },

  /**
   * Demisioner / Anggota -> Alumni
   */
  async promoteToAlumni(userId: string, adminId: string) {
    if (userId === adminId) throw new ForbiddenError('Tidak dapat mengubah status diri sendiri')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User tidak ditemukan')

    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          roleId: 'alumni',
          positionId: null,
          departmentId: null,
          updatedBy: adminId
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          entityId: user.id,
          userId: adminId,
          oldData: JSON.stringify({ roleId: user.roleId, positionId: user.positionId }),
          newData: JSON.stringify({ roleId: 'alumni', positionId: null, message: 'Promoted to Alumni' })
        }
      })

      return updated
    })

    await eventBus.emit('member.alumni', { userId })
    return updated
  }
}
