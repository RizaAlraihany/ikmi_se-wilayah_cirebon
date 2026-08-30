/** @jest-environment node */

import { requirePermission } from '@/core/authorization/guards'
import { UnauthorizedError } from '@/core/errors/custom-errors'
import { storageService } from '@/core/storage/storage-service'
import { documentArchiveService } from '@/features/document-archives/services'
import { GET } from '@/app/api/private/documents/[id]/route'

jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  storageService: { getPrivateDocumentUrl: jest.fn() },
}))
jest.mock('@/features/document-archives/services', () => ({
  documentArchiveService: { authorizeDownload: jest.fn() },
}))

const requirePermissionMock = jest.mocked(requirePermission)
const authorizeDownloadMock = jest.mocked(documentArchiveService.authorizeDownload)
const privateUrlMock = jest.mocked(storageService.getPrivateDocumentUrl)

const organizationAdmin = {
  id: 'admin-organization-1',
  roleId: 'admin_organization',
  departmentId: null,
  positionId: null,
}

function requestDocument(id = 'document-1') {
  return GET(new Request(`https://dashboard.test/api/private/documents/${id}`), { params: Promise.resolve({ id }) })
}

describe('private document download route', () => {
  it('rejects anonymous access before looking up storage metadata', async () => {
    requirePermissionMock.mockRejectedValueOnce(new UnauthorizedError())

    const response = await requestDocument()

    expect(response.status).toBe(401)
    expect(authorizeDownloadMock).not.toHaveBeenCalled()
  })

  it('denies Admin Komdigi even if a legacy permission is accidentally granted', async () => {
    requirePermissionMock.mockResolvedValueOnce({ ...organizationAdmin, roleId: 'admin_komdigi' } as never)

    const response = await requestDocument()

    expect(response.status).toBe(403)
    expect(authorizeDownloadMock).not.toHaveBeenCalled()
  })

  it('returns only an expiring private redirect with no-store and noindex headers', async () => {
    requirePermissionMock.mockResolvedValueOnce(organizationAdmin as never)
    authorizeDownloadMock.mockResolvedValueOnce({ publicId: 'documents/random-key', fileName: 'notulen.pdf' })
    privateUrlMock.mockReturnValueOnce('https://res.cloudinary.com/example/authenticated/signed-document')

    const response = await requestDocument()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://res.cloudinary.com/example/authenticated/signed-document')
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive')
    expect(authorizeDownloadMock).toHaveBeenCalledWith('document-1', organizationAdmin)
    expect(privateUrlMock).toHaveBeenCalledWith('documents/random-key')
  })
})
