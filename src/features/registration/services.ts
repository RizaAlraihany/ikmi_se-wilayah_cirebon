import { registrationRepository } from './repository'
import { RegistrationCreateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import { waService } from '@/core/notifications/wa-service'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const registrationService = {
  /**
   * Submit pendaftaran anggota baru dari form web publik.
   * Setelah berhasil, sistem otomatis kirim link invite grup WA ke calon anggota.
   */
  async submitRegistration(data: RegistrationCreateInput) {
    const registration = await registrationRepository.create({
      fullName: data.fullName,
      campus: data.campus,
      major: data.major,
      semester: data.semester,
      address: data.address,
      whatsapp: data.whatsapp,
      reasons: data.reasons,
      status: 'PENDING',
    })

    await eventBus.emit('audit.log', {
      action: 'CREATE',
      entity: 'Registration',
      entityId: registration.id,
      newData: JSON.stringify({ fullName: data.fullName }),
    })

    // Kirim link invite grup WA ke calon anggota (trigger yang diizinkan per AGENTS.md)
    const inviteLink = process.env.WA_GROUP_INVITE_LINK
    if (inviteLink && data.whatsapp) {
      const message =
        `Halo *${data.fullName}*! 👋\n\nTerima kasih telah mendaftar di IKMI Cirebon.\n` +
        `Silakan bergabung ke grup WhatsApp kami:\n${inviteLink}\n\n` +
        `_Sistem Informasi Terpadu IKMI Cirebon_`

      waService.sendMessage({ to: data.whatsapp, message }).catch((err) => {
        console.error('[RegistrationService] WA invite error:', err)
      })
    }

    await eventBus.emit('registration.created', { registrationId: registration.id })

    return registration
  },

  /**
   * Tandai pendaftaran sebagai PROCESSED (sudah masuk ke arsip Sekretaris).
   * Tidak ada approval flow — anggota langsung join via WA invite.
   */
  async markProcessed(id: string, adminId: string) {
    const registration = await registrationRepository.findById(id)
    if (!registration) {
      throw new NotFoundError('Pendaftaran tidak ditemukan.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.registration.update({
        where: { id },
        data: { status: 'PROCESSED' },
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Registration',
          entityId: updated.id,
          userId: adminId,
          oldData: JSON.stringify({ status: registration.status }),
          newData: JSON.stringify({ status: 'PROCESSED' }),
        },
      })

      return updated
    })
  },
}
