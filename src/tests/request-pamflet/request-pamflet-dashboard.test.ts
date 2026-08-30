import { PamfletRequestStatus, WhatsappMessageStatus } from '@prisma/client'
import { ForbiddenError, ValidationError } from '@/core/errors/custom-errors'
import { requirePermission } from '@/core/authorization/guards'
import {
  assignPamfletRequest,
  getPamfletRequestNotificationDeliveries,
  getPamfletRequests,
  updatePamfletRequestStatus,
} from '@/features/request-pamflet/admin-actions'
import { prismaMock } from '../prisma-mock'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/features/notification/whatsapp', () => ({ notifyAdminKomdigiPamfletRequest: jest.fn() }))

const requirePermissionMock = jest.mocked(requirePermission)
const komdigiActor = {
  id: 'admin-komdigi-1',
  roleId: 'admin_komdigi',
  departmentId: null,
  positionId: null,
}

describe('Request Pamflet dashboard authorization and workflow', () => {
  beforeEach(() => {
    requirePermissionMock.mockResolvedValue(komdigiActor)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)
  })

  it('denies Admin Organisasi even if a broad permission is accidentally granted', async () => {
    requirePermissionMock.mockResolvedValueOnce({ ...komdigiActor, roleId: 'admin_organization' })
    await expect(getPamfletRequests()).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.pamfletRequest.findMany).not.toHaveBeenCalled()
  })

  it('authorizes before object lookup on a status mutation', async () => {
    requirePermissionMock.mockRejectedValueOnce(new ForbiddenError())
    await expect(updatePamfletRequestStatus('request-1', PamfletRequestStatus.DITERIMA)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.pamfletRequest.findFirst).not.toHaveBeenCalled()
  })

  it('rejects skipped transitions and requires notes for revision', async () => {
    prismaMock.pamfletRequest.findFirst
      .mockResolvedValueOnce({ id: 'request-1', status: PamfletRequestStatus.BARU, notes: null } as never)
      .mockResolvedValueOnce({ id: 'request-1', status: PamfletRequestStatus.DITERIMA, notes: null } as never)

    await expect(updatePamfletRequestStatus('request-1', PamfletRequestStatus.SELESAI)).rejects.toBeInstanceOf(ValidationError)
    await expect(updatePamfletRequestStatus('request-1', PamfletRequestStatus.PERLU_REVISI)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('updates status and audit log atomically with a compare-and-set guard', async () => {
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({
      id: 'request-1',
      status: PamfletRequestStatus.BARU,
      notes: null,
    } as never)
    prismaMock.pamfletRequest.updateMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
    prismaMock.pamfletRequest.findUnique.mockResolvedValueOnce({ id: 'request-1', status: PamfletRequestStatus.DITERIMA } as never)

    await updatePamfletRequestStatus('request-1', PamfletRequestStatus.DITERIMA)
    expect(prismaMock.pamfletRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'request-1', deletedAt: null, status: PamfletRequestStatus.BARU },
      data: { status: PamfletRequestStatus.DITERIMA, updatedBy: komdigiActor.id },
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        entity: 'PamfletRequest',
        entityId: 'request-1',
        userId: komdigiActor.id,
      }),
    }))
  })

  it('only assigns an active Admin Komdigi and audits the PIC change atomically', async () => {
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({ id: 'request-1', assigneeId: null } as never)
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'pic-1', name: 'PIC Komdigi' } as never)
    prismaMock.pamfletRequest.updateMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-2' } as never)
    prismaMock.pamfletRequest.findUnique.mockResolvedValueOnce({ id: 'request-1', assigneeId: 'pic-1' } as never)

    await assignPamfletRequest('request-1', 'pic-1')
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'pic-1', roleId: 'admin_komdigi', isActive: true, deletedAt: null },
      select: { id: true, name: true },
    })
    expect(prismaMock.pamfletRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'request-1', deletedAt: null, assigneeId: null },
      data: { assigneeId: 'pic-1', updatedBy: komdigiActor.id },
    })
  })

  it('returns notification status with masked recipient numbers', async () => {
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({ requestNumber: 'REQ-PAMFLET-2026-0041' } as never)
    prismaMock.whatsappMessageLog.findMany.mockResolvedValueOnce([{
      recipient: '6281234567890',
      status: WhatsappMessageStatus.FAILED,
      attemptCount: 2,
      providerMessageId: null,
      sentAt: null,
      failedAt: new Date('2026-08-12T05:00:00.000Z'),
      errorMessage: 'Provider unavailable',
      updatedAt: new Date('2026-08-12T05:00:00.000Z'),
    }] as never)

    await expect(getPamfletRequestNotificationDeliveries('request-1')).resolves.toEqual([
      expect.objectContaining({ recipient: '•••• 7890', status: WhatsappMessageStatus.FAILED }),
    ])
    expect(prismaMock.whatsappMessageLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { idempotencyKey: { startsWith: 'req_pamflet_REQ-PAMFLET-2026-0041_' } },
    }))
  })
})
