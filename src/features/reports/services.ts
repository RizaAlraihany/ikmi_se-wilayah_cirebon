import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { reportQueries } from './queries'
import { reportSubmitSchema, ReportSubmitInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { LPJStatus } from '@prisma/client'
import { eventBus } from '@/core/events/event-bus'

export const reportService = {
  /**
   * Submit LPJ untuk sebuah event (oleh User atau Admin).
   */
  async submitReport(input: ReportSubmitInput, userId: string) {
    const validated = reportSubmitSchema.parse(input)

    const report = await prisma.report.create({
      data: {
        eventId: validated.eventId || null,
        lpjTokenId: validated.lpjTokenId || null,
        title: validated.title,
        documentUrl: validated.documentUrl,
        documentPublicId: validated.documentPublicId || null,
        status: LPJStatus.SUBMITTED,
        submittedBy: userId,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Report',
        entityId: report.id,
        newData: JSON.stringify(validated),
        userId,
      },
    })

    await eventBus.emit('lpj.submitted', { id: report.id })
    return report
  },

  /**
   * Verifikasi LPJ oleh Bendahara (single-step verification).
   */
  async verifyReport(id: string, userId: string, notes?: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    if (!(await can('lpj.verify', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk verifikasi LPJ')
    }

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status !== LPJStatus.SUBMITTED) {
      throw new ValidationError('Hanya LPJ berstatus SUBMITTED yang dapat diverifikasi')
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: LPJStatus.VERIFIED,
        verifiedBy: userId,
        verifiedAt: new Date(),
        verifyNotes: notes || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'VERIFY',
        entity: 'Report',
        entityId: id,
        oldData: JSON.stringify(report),
        newData: JSON.stringify({ status: LPJStatus.VERIFIED, verifiedBy: userId }),
        userId,
      },
    })

    await eventBus.emit('lpj.verified', { id: updated.id })
    return updated
  },

  /**
   * Tolak LPJ oleh Bendahara.
   */
  async rejectReport(id: string, userId: string, notes?: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    if (!(await can('lpj.verify', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk menolak LPJ')
    }

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status === LPJStatus.REJECTED || report.status === LPJStatus.VERIFIED) {
      throw new ValidationError('Status LPJ saat ini tidak bisa ditolak')
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status: LPJStatus.REJECTED, verifyNotes: notes || null },
    })

    await prisma.auditLog.create({
      data: {
        action: 'REJECT',
        entity: 'Report',
        entityId: id,
        oldData: JSON.stringify(report),
        newData: JSON.stringify({ status: LPJStatus.REJECTED }),
        userId,
      },
    })

    await eventBus.emit('lpj.rejected', { id: updated.id })
    return updated
  },
}
