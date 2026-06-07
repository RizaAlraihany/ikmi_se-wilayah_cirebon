/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { financeService } from '../services'

jest.mock('@/core/database/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    financeRequest: { update: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb.map(p => p instanceof Promise ? p : p))
      }
      return cb()
    })
  }
}))

jest.mock('@/core/authorization/rbac', () => ({
  can: jest.fn()
}))

jest.mock('../queries', () => ({
  financeQueries: {
    getRequestById: jest.fn()
  }
}))

jest.mock('@/core/events/event-bus', () => ({
  eventBus: {
    emit: jest.fn()
  }
}))

import { prisma } from '@/core/database/prisma'
import { can } from '@/core/authorization/rbac'
import { financeQueries } from '../queries'

describe('Finance Service - Approval', () => {
  it('should approve tier 1 if user has permission and request is PENDING', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user1', roleId: 'kadep' })
    ;(can as jest.Mock).mockResolvedValue(true)
    financeQueries.getRequestById.mockResolvedValue({ id: 'req1', status: 'PENDING' })
    prisma.financeRequest.update.mockResolvedValue({ id: 'req1', status: 'APPROVED_TIER1' })

    const result = await financeService.approveTier1('req1', 'user1')
    
    expect(can).toHaveBeenCalledWith('finance.approve.tier1', expect.anything())
    expect(result.status).toBe('APPROVED_TIER1')
  })

  it('should throw error if approving tier 2 without permission', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user2', roleId: 'staff' })
    ;(can as jest.Mock).mockResolvedValue(false)

    await expect(financeService.approveTier2('req2', 'user2')).rejects.toThrow('Tidak memiliki izin')
  })
})
