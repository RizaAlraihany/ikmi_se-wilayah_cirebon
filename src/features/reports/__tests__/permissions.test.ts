import { requirePermissionForUser } from '@/core/authorization/guards'
import { LPJ_SUBMIT_PERMISSION, LPJ_VERIFY_BPH_PERMISSION } from '@/core/authorization/permission-ids'
import { eventBus } from '@/core/events/event-bus'
import { prismaMock } from '@/tests/prisma-mock'
import { reportQueries } from '../queries'
import { reportService } from '../services'

jest.mock('@/core/authorization/guards', () => ({
  requirePermissionForUser: jest.fn(),
}))

jest.mock('../queries', () => ({
  reportQueries: {
    getReportById: jest.fn(),
  },
}))

describe('report service authorization', () => {
  const actor = {
    id: 'bendahara-1',
    roleId: 'admin_bendahara',
    departmentId: 'BPH',
    positionId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requirePermissionForUser).mockResolvedValue(actor)
  })

  it('checks LPJ submission permission at the service boundary', async () => {
    prismaMock.report.create.mockResolvedValue({ id: 'report-1' } as never)
    prismaMock.auditLog.create.mockResolvedValue({} as never)

    await reportService.submitReport(
      {
        title: 'LPJ Kegiatan',
        documentUrl: 'https://example.com/lpj.pdf',
      },
      'caller-1',
    )

    expect(requirePermissionForUser).toHaveBeenCalledWith('caller-1', LPJ_SUBMIT_PERMISSION)
    expect(prismaMock.report.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ submittedBy: actor.id }),
    }))
    expect(eventBus.emit).toHaveBeenCalledWith('lpj.submitted', { id: 'report-1' })
  })

  it('uses the existing Bendahara permission for approval and rejection', async () => {
    jest.mocked(reportQueries.getReportById).mockResolvedValue({
      id: 'report-1',
      status: 'SUBMITTED',
    } as never)
    prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'VERIFIED' } as never)
    prismaMock.auditLog.create.mockResolvedValue({} as never)

    await reportService.verifyReport('report-1', 'caller-1')

    expect(requirePermissionForUser).toHaveBeenCalledWith('caller-1', LPJ_VERIFY_BPH_PERMISSION)
    expect(prismaMock.report.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verifiedBy: actor.id }),
    }))

    jest.clearAllMocks()
    jest.mocked(requirePermissionForUser).mockResolvedValue(actor)
    jest.mocked(reportQueries.getReportById).mockResolvedValue({
      id: 'report-1',
      status: 'SUBMITTED',
    } as never)
    prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'REJECTED' } as never)
    prismaMock.auditLog.create.mockResolvedValue({} as never)

    await reportService.rejectReport('report-1', 'caller-1')

    expect(requirePermissionForUser).toHaveBeenCalledWith('caller-1', LPJ_VERIFY_BPH_PERMISSION)
  })
})
