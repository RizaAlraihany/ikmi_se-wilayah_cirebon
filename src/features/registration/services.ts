import { registrationRepository } from './repositories'
import { RegistrationCreateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const registrationService = {
  async submitRegistration(data: RegistrationCreateInput) {
    const registration = await registrationRepository.create({
      fullName: data.fullName,
      campus: data.campus,
      major: data.major,
      semester: data.semester,
      address: data.address,
      whatsapp: data.whatsapp,
      reasons: data.reasons,
      status: 'PENDING'
    })

    // Emit event
    await eventBus.emit('registration.created', {
      registrationId: registration.id
    })

    await eventBus.emit('audit.log', {
      action: 'CREATE',
      entity: 'Registration',
      entityId: registration.id,
      newData: JSON.stringify(registration)
    })

    return registration
  },

  async reviewRegistration(id: string, status: 'APPROVED' | 'REJECTED', adminId: string) {
    const registration = await registrationRepository.findById(id)
    if (!registration) {
      throw new NotFoundError('Pendaftaran tidak ditemukan.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.registration.update({
        where: { id },
        data: { status }
      })

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
          entity: 'Registration',
          entityId: updated.id,
          userId: adminId,
          oldData: JSON.stringify({ status: registration.status }),
          newData: JSON.stringify({ status: updated.status })
        }
      })

      // Emit Event
      if (status === 'APPROVED') {
        await eventBus.emit('registration.approved', { registrationId: updated.id })
      } else {
        await eventBus.emit('registration.rejected', { registrationId: updated.id })
      }

      return updated
    })
  }
}
