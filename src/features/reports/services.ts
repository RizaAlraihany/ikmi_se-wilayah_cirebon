import { requirePermissionForUser } from '@/core/authorization/guards'
import { LPJ_SUBMIT_PERMISSION, LPJ_VERIFY_BPH_PERMISSION } from '@/core/authorization/permission-ids'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { reportQueries } from './queries'
import { reportSubmitSchema, ReportSubmitInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { LPJStatus } from '@prisma/client'
import { eventBus } from '@/core/events/event-bus'
import { serializeAuditData } from '@/features/audit/audit-data'

export const reportService = {
  /**
   * Submit LPJ untuk sebuah event (oleh User atau Admin).
   */
  async submitReport(input: ReportSubmitInput, userId: string) {
    const actor = await requirePermissionForUser(userId, LPJ_SUBMIT_PERMISSION)
    const validated = reportSubmitSchema.parse(input)

    const report = await prisma.report.create({
      data: {
        eventId: validated.eventId || null,
        lpjTokenId: validated.lpjTokenId || null,
        title: validated.title,
        documentUrl: validated.documentUrl,
        documentPublicId: validated.documentPublicId || null,
        status: LPJStatus.SUBMITTED,
        submittedBy: actor.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Report',
        entityId: report.id,
        newData: serializeAuditData(validated),
        userId: actor.id,
      },
    })

    await eventBus.emit('lpj.submitted', { id: report.id })
    return report
  },

  /**
   * Verifikasi LPJ oleh Bendahara (single-step verification).
   */
  async verifyReport(id: string, userId: string, notes?: string) {
    const actor = await requirePermissionForUser(userId, LPJ_VERIFY_BPH_PERMISSION)

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status !== LPJStatus.SUBMITTED) {
      throw new ValidationError('Hanya LPJ berstatus SUBMITTED yang dapat diverifikasi')
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: LPJStatus.VERIFIED,
        verifiedBy: actor.id,
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
        newData: JSON.stringify({ status: LPJStatus.VERIFIED, verifiedBy: actor.id }),
        userId: actor.id,
      },
    })

    await eventBus.emit('lpj.verified', { id: updated.id })
    return updated
  },

  /**
   * Tolak LPJ oleh Bendahara.
   */
  async rejectReport(id: string, userId: string, notes?: string) {
    const actor = await requirePermissionForUser(userId, LPJ_VERIFY_BPH_PERMISSION)

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
        userId: actor.id,
      },
    })

    await eventBus.emit('lpj.rejected', { id: updated.id })
    return updated
  },
}
