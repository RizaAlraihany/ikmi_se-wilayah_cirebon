/** @jest-environment node */

import { requirePermission } from '@/core/authorization/guards'
import { UnauthorizedError } from '@/core/errors/custom-errors'
import { storageService } from '@/core/storage/storage-service'
import { GET as getReport } from '@/app/api/private/reports/[id]/route'
import { GET as getLetter } from '@/app/api/private/letters/[id]/route'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  storageService: { getPrivateDocumentUrl: jest.fn() },
}))

const requirePermissionMock = jest.mocked(requirePermission)
const privateUrlMock = jest.mocked(storageService.getPrivateDocumentUrl)
const organizationAdmin = {
  id: 'admin-organization-1',
  roleId: 'admin_organization',
  departmentId: null,
  positionId: null,
}

describe('legacy internal file IDOR boundaries', () => {
  it('rejects anonymous Report access before object lookup', async () => {
    requirePermissionMock.mockRejectedValueOnce(new UnauthorizedError())

    const response = await getReport(new Request('https://dashboard.test/api/private/reports/report-1'), {
      params: Promise.resolve({ id: 'report-1' }),
    })

    expect(response.status).toBe(401)
    expect(prismaMock.report.findFirst).not.toHaveBeenCalled()
  })

  it('denies cross-role Report and Letter access even with a stale permission grant', async () => {
    requirePermissionMock.mockResolvedValue({ ...organizationAdmin, roleId: 'admin_komdigi' } as never)

    const reportResponse = await getReport(new Request('https://dashboard.test/api/private/reports/report-1'), {
      params: Promise.resolve({ id: 'report-1' }),
    })
    const letterResponse = await getLetter(new Request('https://dashboard.test/api/private/letters/letter-1'), {
      params: Promise.resolve({ id: 'letter-1' }),
    })

    expect(reportResponse.status).toBe(403)
    expect(letterResponse.status).toBe(403)
    expect(prismaMock.report.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.letter.findFirst).not.toHaveBeenCalled()
  })

  it('returns only expiring no-store redirects to an authorized organization admin', async () => {
    requirePermissionMock.mockResolvedValue(organizationAdmin as never)
    prismaMock.report.findFirst.mockResolvedValueOnce({ documentPublicId: 'reports/random-key' } as never)
    prismaMock.letter.findFirst.mockResolvedValueOnce({ filePublicId: 'letters/random-key' } as never)
    privateUrlMock
      .mockReturnValueOnce('https://res.cloudinary.com/example/authenticated/signed-report')
      .mockReturnValueOnce('https://res.cloudinary.com/example/authenticated/signed-letter')

    const reportResponse = await getReport(new Request('https://dashboard.test/api/private/reports/report-1'), {
      params: Promise.resolve({ id: 'report-1' }),
    })
    const letterResponse = await getLetter(new Request('https://dashboard.test/api/private/letters/letter-1'), {
      params: Promise.resolve({ id: 'letter-1' }),
    })

    expect(reportResponse.status).toBe(307)
    expect(letterResponse.status).toBe(307)
    expect(reportResponse.headers.get('cache-control')).toContain('no-store')
    expect(letterResponse.headers.get('cache-control')).toContain('no-store')
    expect(reportResponse.headers.get('location')).toContain('/authenticated/signed-report')
    expect(letterResponse.headers.get('location')).toContain('/authenticated/signed-letter')
  })
})
