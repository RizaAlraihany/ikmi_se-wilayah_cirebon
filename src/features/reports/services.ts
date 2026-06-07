import { eventBus } from '@/core/events/event-bus'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { reportQueries } from './queries'
import { reportPolicies } from './policies'
import { reportSubmitSchema, ReportSubmitInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { LPJStatus } from '@prisma/client'

export const reportService = {
  async submitReport(input: ReportSubmitInput, userId: string) {
    const validated = reportSubmitSchema.parse(input)
    
    const event = await prisma.event.findUnique({ 
      where: { id: validated.eventId },
      include: { program: true } 
    })
    if (!event) throw new NotFoundError('Event tidak ditemukan')

    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    const isOwner = reportPolicies.canManageReport(userObj, event)
    if (!isOwner && userObj.role.name !== 'Super Admin') {
      throw new ForbiddenError('Tidak memiliki izin untuk mensubmit LPJ pada event ini')
    }

    const existingReport = await prisma.report.findUnique({ where: { eventId: event.id } })
    if (existingReport) {
      throw new ValidationError('LPJ untuk event ini sudah disubmit')
    }

    const [report] = await prisma.$transaction([
      prisma.report.create({
        data: {
          eventId: event.id,
          documentUrl: validated.documentUrl,
          status: LPJStatus.SUBMITTED,
          submittedBy: userId,
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Report',
          entityId: 'NEW', 
          newData: JSON.stringify(validated),
          userId,
        }
      })
    ])

    await prisma.auditLog.updateMany({
      where: { entityId: 'NEW', entity: 'Report', userId },
      data: { entityId: report.id }
    })

    await eventBus.emit('lpj.submitted', { id: report.id })
    return report
  },

  async verifyDepartmentReport(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    if (!(await can('lpj.verify.department', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk verifikasi LPJ Departemen')
    }

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status !== LPJStatus.SUBMITTED) {
       throw new ValidationError('Hanya LPJ berstatus SUBMITTED yang dapat diverifikasi')
    }

    const [updated] = await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: { 
          status: LPJStatus.VERIFIED_DEPARTMENT,
          verifiedBy: userId,
          verifiedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'VERIFY',
          entity: 'Report',
          entityId: id,
          oldData: JSON.stringify(report),
          newData: JSON.stringify({ status: LPJStatus.VERIFIED_DEPARTMENT, verifiedBy: userId }),
          userId,
        }
      })
    ])

    await eventBus.emit('lpj.verified.department', { id: updated.id })
    return updated
  },

  async verifyBphReport(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    if (!(await can('lpj.verify.bph', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk verifikasi LPJ BPH')
    }

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status !== LPJStatus.VERIFIED_DEPARTMENT) {
       throw new ValidationError('Hanya LPJ berstatus VERIFIED_DEPARTMENT yang dapat diverifikasi BPH')
    }

    const [updated] = await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: { 
          status: LPJStatus.VERIFIED_BPH,
          verifiedBy: userId,
          verifiedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'VERIFY',
          entity: 'Report',
          entityId: id,
          oldData: JSON.stringify(report),
          newData: JSON.stringify({ status: LPJStatus.VERIFIED_BPH, verifiedBy: userId }),
          userId,
        }
      })
    ])

    await eventBus.emit('lpj.verified.bph', { id: updated.id })
    return updated
  },

  async rejectReport(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    const canDept = await can('lpj.verify.department', userObj)
    const canBph = await can('lpj.verify.bph', userObj)
    
    if (!canDept && !canBph) {
      throw new ForbiddenError('Tidak memiliki izin untuk menolak LPJ')
    }

    const report = await reportQueries.getReportById(id)
    if (!report) throw new NotFoundError('LPJ tidak ditemukan')

    if (report.status === LPJStatus.REJECTED || report.status === LPJStatus.VERIFIED_BPH) {
       throw new ValidationError('Status LPJ saat ini tidak bisa ditolak')
    }

    const [updated] = await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: { status: LPJStatus.REJECTED }
      }),
      prisma.auditLog.create({
        data: {
          action: 'REJECT',
          entity: 'Report',
          entityId: id,
          oldData: JSON.stringify(report),
          newData: JSON.stringify({ status: LPJStatus.REJECTED }),
          userId,
        }
      })
    ])

    await eventBus.emit('lpj.rejected', { id: updated.id })
    return updated
  }
}
