/** @jest-environment node */

import { requirePermission } from '@/core/authorization/guards'
import { storageService } from '@/core/storage/storage-service'
import { GET } from '@/app/api/private/pamflet-requests/[id]/route'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  storageService: { getPrivateFileUrl: jest.fn() },
}))

const requirePermissionMock = jest.mocked(requirePermission)
const privateUrlMock = jest.mocked(storageService.getPrivateFileUrl)

describe('private Request Pamflet attachment route', () => {
  it('denies Admin Organisasi before reading the attachment object', async () => {
    requirePermissionMock.mockResolvedValueOnce({ id: 'org-1', roleId: 'admin_organization' } as never)
    const response = await GET(new Request('https://dashboard.test/api/private/pamflet-requests/request-1'), {
      params: Promise.resolve({ id: 'request-1' }),
    })
    expect(response.status).toBe(403)
    expect(prismaMock.pamfletRequest.findFirst).not.toHaveBeenCalled()
  })

  it('redirects an authorized Admin Komdigi to a short-lived signed image URL', async () => {
    requirePermissionMock.mockResolvedValueOnce({ id: 'komdigi-1', roleId: 'admin_komdigi' } as never)
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({
      attachmentPublicId: 'pamflet-requests/private-image',
      attachmentMimeType: 'image/webp',
    } as never)
    privateUrlMock.mockReturnValueOnce('https://res.cloudinary.com/signed-private-image')

    const response = await GET(new Request('https://dashboard.test/api/private/pamflet-requests/request-1'), {
      params: Promise.resolve({ id: 'request-1' }),
    })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://res.cloudinary.com/signed-private-image')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(privateUrlMock).toHaveBeenCalledWith('pamflet-requests/private-image', 'image')
  })

  it('returns 404 when no private storage key exists', async () => {
    requirePermissionMock.mockResolvedValueOnce({ id: 'super-1', roleId: 'super_admin' } as never)
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({ attachmentPublicId: null, attachmentMimeType: null } as never)
    const response = await GET(new Request('https://dashboard.test/api/private/pamflet-requests/request-legacy'), {
      params: Promise.resolve({ id: 'request-legacy' }),
    })
    expect(response.status).toBe(404)
    expect(privateUrlMock).not.toHaveBeenCalled()
  })
})
