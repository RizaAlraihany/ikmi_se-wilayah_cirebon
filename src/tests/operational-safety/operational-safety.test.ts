import { BroadcastStatus } from '@prisma/client'
import { claimBroadcast, createContentPlanBroadcastKey, recordBroadcastResult } from '@/features/content-plan/broadcast-service'
import { getEventScheduleState, requiresStatusConfirmation } from '@/features/events/schedule-state'
import { syncEventScheduleStates } from '@/jobs/reminder-job'
import { prismaMock } from '../prisma-mock'
import { assertDevelopmentSeedAllowed, assertMasterDataSeedAllowed } from '../../../prisma/bootstrap'

describe('operational safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('derives schedule state without inferring execution status', () => {
    const now = new Date('2026-08-08T10:00:00.000Z')

    expect(getEventScheduleState(new Date('2026-08-09T10:00:00.000Z'), new Date('2026-08-09T12:00:00.000Z'), now)).toBe('UPCOMING')
    expect(getEventScheduleState(new Date('2026-08-08T09:00:00.000Z'), new Date('2026-08-08T12:00:00.000Z'), now)).toBe('DUE')
    expect(getEventScheduleState(new Date('2026-08-07T09:00:00.000Z'), new Date('2026-08-07T12:00:00.000Z'), now)).toBe('PAST_DUE')
    expect(requiresStatusConfirmation('PAST_DUE')).toBe(true)
  })

  it('updates schedule state and records confirmation needs without changing execution status', async () => {
    prismaMock.event.updateMany
      .mockResolvedValueOnce({ count: 1 } as never)
      .mockResolvedValueOnce({ count: 2 } as never)
      .mockResolvedValueOnce({ count: 3 } as never)
      .mockResolvedValueOnce({ count: 4 } as never)

    const result = await syncEventScheduleStates(new Date('2026-08-08T10:00:00.000Z'))

    expect(result).toEqual({ upcoming: 1, due: 2, pastDue: 3, statusConfirmationsNeeded: 4 })
    expect(prismaMock.event.updateMany).toHaveBeenCalledTimes(4)
    for (const [call] of prismaMock.event.updateMany.mock.calls.slice(0, 3)) {
      expect(call.data).toHaveProperty('scheduleState')
      expect(call.data).not.toHaveProperty('status')
    }
    expect(prismaMock.event.updateMany.mock.calls[3]?.[0].data).toEqual({ statusConfirmationState: 'NEEDS_STATUS_CONFIRMATION' })
    expect(prismaMock.program.updateMany).not.toHaveBeenCalled()
  })

  it('does not claim a broadcast that was already sent', async () => {
    prismaMock.broadcastDelivery.findUnique.mockResolvedValueOnce({
      id: 'delivery-1',
      status: BroadcastStatus.SENT,
      updatedAt: new Date(),
    } as never)

    await expect(claimBroadcast('content-plan:2026-08:6281', '6281')).resolves.toEqual({ kind: 'already_sent' })
    expect(prismaMock.broadcastDelivery.create).not.toHaveBeenCalled()
    expect(prismaMock.broadcastDelivery.updateMany).not.toHaveBeenCalled()
  })

  it('does not retry an ambiguous sending delivery, even after it is stale', async () => {
    prismaMock.broadcastDelivery.findUnique.mockResolvedValueOnce({
      id: 'delivery-1',
      status: BroadcastStatus.SENDING,
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    } as never)

    await expect(claimBroadcast('content-plan:2026-08:6281', '6281')).resolves.toEqual({ kind: 'in_progress' })
    expect(prismaMock.broadcastDelivery.updateMany).not.toHaveBeenCalled()
  })

  it('records one claim and its provider result for a new broadcast key', async () => {
    prismaMock.broadcastDelivery.findUnique.mockResolvedValueOnce(null)
    prismaMock.broadcastDelivery.create.mockResolvedValueOnce({ id: 'delivery-1' } as never)

    const key = createContentPlanBroadcastKey('2026-08', '6281')
    await expect(claimBroadcast(key, '6281')).resolves.toEqual({ kind: 'claimed', deliveryId: 'delivery-1' })
    expect(prismaMock.broadcastDelivery.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        broadcastKey: key,
        status: BroadcastStatus.SENDING,
        attemptCount: 1,
      }),
    }))

    await recordBroadcastResult('delivery-1', { success: true, provider: 'fonnte', messageId: 'provider-1' })
    expect(prismaMock.broadcastDelivery.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: BroadcastStatus.SENT,
        providerMessageId: 'provider-1',
      }),
    }))
  })
  it('blocks unsafe seed entry points without explicit configuration', () => {
    const originalNodeEnv = process.env.NODE_ENV
    const originalDevelopmentPassword = process.env.DEV_SEED_PASSWORD
    const originalDevelopmentApproval = process.env.ALLOW_DEVELOPMENT_SEED
    const originalMasterDataApproval = process.env.ALLOW_MASTER_DATA_SEED

    Reflect.set(process.env, 'NODE_ENV', 'production')
    delete process.env.DEV_SEED_PASSWORD
    delete process.env.ALLOW_DEVELOPMENT_SEED
    delete process.env.ALLOW_MASTER_DATA_SEED
    expect(() => assertDevelopmentSeedAllowed()).toThrow('Development seed cannot run in production')
    expect(() => assertMasterDataSeedAllowed()).toThrow('ALLOW_MASTER_DATA_SEED=true')

    Reflect.set(process.env, 'NODE_ENV', 'development')
    expect(() => assertDevelopmentSeedAllowed()).toThrow('ALLOW_DEVELOPMENT_SEED=true')
    Reflect.set(process.env, 'ALLOW_DEVELOPMENT_SEED', 'true')
    expect(() => assertDevelopmentSeedAllowed()).toThrow('DEV_SEED_PASSWORD')

    if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Reflect.set(process.env, 'NODE_ENV', originalNodeEnv)
    if (originalDevelopmentPassword === undefined) delete process.env.DEV_SEED_PASSWORD
    else process.env.DEV_SEED_PASSWORD = originalDevelopmentPassword
    if (originalDevelopmentApproval === undefined) delete process.env.ALLOW_DEVELOPMENT_SEED
    else process.env.ALLOW_DEVELOPMENT_SEED = originalDevelopmentApproval
    if (originalMasterDataApproval === undefined) delete process.env.ALLOW_MASTER_DATA_SEED
    else process.env.ALLOW_MASTER_DATA_SEED = originalMasterDataApproval
  })
})
