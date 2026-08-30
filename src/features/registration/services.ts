import { registrationRepository } from './repository'
import { RegistrationCreateInput } from './schemas'
import { RegStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import { waService } from '@/core/notifications/wa-service'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { canTransitionRegistration } from './domain'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const registrationService = {
  /** Public registration never creates a dashboard account. */
  async submitRegistration(data: RegistrationCreateInput) {
    const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date())
    const prefix = `REG-${year}-`
    const registration = await prisma.$transaction(async (tx: TxClient) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`
      const latest = await tx.registration.findFirst({ where: { registrationNumber: { startsWith: prefix } }, orderBy: { registrationNumber: 'desc' }, select: { registrationNumber: true } })
      const previous = latest?.registrationNumber ? Number(latest.registrationNumber.slice(prefix.length)) : 0
      const registrationNumber = `${prefix}${String(Number.isSafeInteger(previous) ? previous + 1 : 1).padStart(4, '0')}`
      return tx.registration.create({ data: {
      registrationNumber,
      fullName: data.fullName,
      email: data.email,
      campus: data.campus,
      major: data.major,
      semester: data.semester,
      entryYear: data.entryYear,
      district: data.district,
      village: data.village,
      address: data.address,
      whatsapp: data.whatsapp,
      reasons: data.reasons,
      organizationExperience: data.organizationExperience || null,
      interests: data.interests || null,
      consentAt: new Date(),
      status: 'NEW',
    } }) })
    await eventBus.emit('audit.log', { action: 'CREATE', entity: 'Registration', entityId: registration.id, newData: JSON.stringify({ fullName: data.fullName }) })
    await eventBus.emit('registration.created', { registrationId: registration.id })
    return registration
  },

  /** Accepting a registration creates/updates one active Member record. */
  async updateStatus(id: string, status: RegStatus, adminId: string) {
    const actor = await requirePermissionForUser(adminId, 'registration.review')
    if (!isOrganizationAdminRole(actor.roleId) && !isSuperAdminRole(actor.roleId)) throw new ForbiddenError('Pendaftaran hanya dapat diproses Admin Organisasi.')
    const registration = await registrationRepository.findById(id)
    if (!registration || registration.deletedAt) throw new NotFoundError('Pendaftaran tidak ditemukan.')

    if (!canTransitionRegistration(registration.status, status)) throw new ValidationError('Transisi status pendaftaran tidak valid.')
    const shouldSendInvite = status === RegStatus.ACTIVE_MEMBER && registration.status !== RegStatus.ACTIVE_MEMBER
    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const next = await tx.registration.update({ where: { id }, data: { status, updatedBy: actor.id } })
      if (status === RegStatus.ACTIVE_MEMBER) {
        const semester = Number.parseInt(next.semester.replace(/\D/g, ''), 10)
        await tx.member.upsert({
          where: { registrationId: next.id },
          create: {
            registrationId: next.id,
            registrationNumber: next.registrationNumber,
            fullName: next.fullName,
            email: next.email,
            phone: next.whatsapp,
            campus: next.campus,
            studyProgram: next.major,
            semester: Number.isNaN(semester) ? null : semester,
            entryYear: next.entryYear,
            district: next.district,
            village: next.village,
            membershipStatus: 'ACTIVE_MEMBER',
            joinedAt: new Date(),
          },
          update: {
            registrationNumber: next.registrationNumber,
            fullName: next.fullName,
            email: next.email,
            phone: next.whatsapp,
            campus: next.campus,
            studyProgram: next.major,
            semester: Number.isNaN(semester) ? null : semester,
            entryYear: next.entryYear,
            district: next.district,
            village: next.village,
            membershipStatus: 'ACTIVE_MEMBER',
            joinedAt: new Date(),
          },
        })
      }
      await tx.auditLog.create({
        data: {
          action: 'UPDATE', entity: 'Registration', entityId: next.id, userId: actor.id,
          oldData: JSON.stringify({ status: registration.status }), newData: JSON.stringify({ status }),
        },
      })
      return next
    })

    // Notification is secondary: membership activation remains successful if it fails.
    if (shouldSendInvite && process.env.WA_GROUP_INVITE_LINK) {
      const message = `Halo *${updated.fullName}*!\n\nPendaftaran Anda telah diterima sebagai anggota aktif IKMI Cirebon.\nSilakan bergabung ke grup WhatsApp kami:\n${process.env.WA_GROUP_INVITE_LINK}\n\n_Sistem Informasi Terpadu IKMI Cirebon_`
      void waService.sendMessage({ to: updated.whatsapp, message }).catch((error) => {
        console.error('[RegistrationService] WA invite error:', error)
      })
    }
    return updated
  },
}
