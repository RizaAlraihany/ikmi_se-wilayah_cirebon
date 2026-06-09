import { eventBus } from '@/core/events/event-bus'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { financeRepository } from './repository'
import { financeQueries } from './queries'
import { financeRequestCreateSchema, FinanceRequestCreateInput } from './schemas'
import { FinanceStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'

export const financeService = {
  async createRequest(input: FinanceRequestCreateInput, userId: string, departmentId: string) {
    const validated = financeRequestCreateSchema.parse(input)
    
    const request = await financeRepository.create({
      amount: validated.amount,
      description: validated.description,
      proofUrl: validated.proofUrl,
      departmentId,
      status: FinanceStatus.PENDING,
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'FinanceRequest',
        entityId: request.id,
        newData: JSON.stringify(request),
        userId,
      }
    })

    await eventBus.emit('finance.requested', { id: request.id })
    return request
  },

  async approveTier1(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User not found')

    if (!(await can('finance.approve_tier1', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk menyetujui Tier 1')
    }

    const request = await financeQueries.getRequestById(id)
    if (!request) throw new NotFoundError('Request tidak ditemukan')
    
    if (userObj.roleId !== 'super_admin' && request.departmentId !== userObj.departmentId) {
      throw new ForbiddenError('Tidak memiliki izin: departemen tidak sesuai')
    }

    if (request.status !== FinanceStatus.PENDING) {
       throw new ValidationError('Hanya request PENDING yang dapat disetujui Tier 1')
    }

    const [updated] = await prisma.$transaction([
      prisma.financeRequest.update({
        where: { id },
        data: { status: FinanceStatus.APPROVED_TIER1, approvedBy1: userId }
      }),
      prisma.auditLog.create({
        data: {
          action: 'APPROVE',
          entity: 'FinanceRequest',
          entityId: id,
          oldData: JSON.stringify(request),
          newData: JSON.stringify({ status: FinanceStatus.APPROVED_TIER1, approvedBy1: userId }),
          userId,
        }
      })
    ])

    await eventBus.emit('finance.approved.tier1', { id: updated.id })
    return updated
  },

  async approveTier2(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User not found')

    if (!(await can('finance.approve_tier2', userObj))) {
      throw new ForbiddenError('Tidak memiliki izin untuk menyetujui Tier 2')
    }

    const request = await financeQueries.getRequestById(id)
    if (!request) throw new NotFoundError('Request tidak ditemukan')

    if (request.status !== FinanceStatus.APPROVED_TIER1) {
       throw new ValidationError('Hanya request APPROVED_TIER1 yang dapat disetujui Tier 2')
    }

    const [updated] = await prisma.$transaction([
      prisma.financeRequest.update({
        where: { id },
        data: { status: FinanceStatus.COMPLETED, approvedBy2: userId }
      }),
      prisma.auditLog.create({
        data: {
          action: 'APPROVE',
          entity: 'FinanceRequest',
          entityId: id,
          oldData: JSON.stringify(request),
          newData: JSON.stringify({ status: FinanceStatus.COMPLETED, approvedBy2: userId }),
          userId,
        }
      })
    ])

    await eventBus.emit('finance.completed', { id: updated.id })
    return updated
  },

  async rejectRequest(id: string, userId: string) {
    const userObj = await prisma.user.findUnique({ where: { id: userId } })
    if (!userObj) throw new NotFoundError('User not found')

    const canTier1 = await can('finance.approve_tier1', userObj)
    const canTier2 = await can('finance.approve_tier2', userObj)
    
    if (!canTier1 && !canTier2) {
      throw new ForbiddenError('Tidak memiliki izin untuk menolak request')
    }

    const request = await financeQueries.getRequestById(id)
    if (!request) throw new NotFoundError('Request tidak ditemukan')
    
    if (userObj.roleId !== 'super_admin' && !canTier2 && request.departmentId !== userObj.departmentId) {
      throw new ForbiddenError('Tidak memiliki izin: departemen tidak sesuai')
    }

    if (request.status === FinanceStatus.COMPLETED || request.status === FinanceStatus.REJECTED) {
      throw new ValidationError('Request sudah diselesaikan atau ditolak')
    }

    const [updated] = await prisma.$transaction([
      prisma.financeRequest.update({
        where: { id },
        data: { status: FinanceStatus.REJECTED }
      }),
      prisma.auditLog.create({
        data: {
          action: 'REJECT',
          entity: 'FinanceRequest',
          entityId: id,
          oldData: JSON.stringify(request),
          newData: JSON.stringify({ status: FinanceStatus.REJECTED }),
          userId,
        }
      })
    ])

    await eventBus.emit('finance.rejected', { id: updated.id })
    return updated
  }
}
