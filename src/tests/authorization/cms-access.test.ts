import { can } from '@/core/authorization/rbac'
import { ForbiddenError } from '@/core/errors/custom-errors'
import { isKomdigi, requireCmsUpdate } from '@/features/cms/access'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/rbac', () => ({ can: jest.fn() }))

const canMock = can as jest.Mock

describe('CMS role boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('recognizes the final Admin Komdigi role instead of a department label', () => {
    expect(isKomdigi({ roleId: 'admin_komdigi' })).toBe(true)
    expect(isKomdigi({ roleId: 'admin_organization' })).toBe(false)
  })

  it('rejects an organization admin with a legacy CMS permission even when their department says KOMDIGI', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'org-admin',
      roleId: 'admin_organization',
      departmentId: 'komdigi-department',
      department: { code: 'KOMDIGI', name: 'Komunikasi & Digitalisasi' },
    } as never)
    canMock.mockResolvedValue(true)

    await expect(requireCmsUpdate('org-admin')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('allows the Admin Komdigi role without relying on a department code', async () => {
    const komdigiAdmin = {
      id: 'komdigi-admin',
      roleId: 'admin_komdigi',
      departmentId: null,
      department: null,
    }
    prismaMock.user.findFirst.mockResolvedValue(komdigiAdmin as never)
    canMock.mockResolvedValue(true)

    await expect(requireCmsUpdate('komdigi-admin')).resolves.toEqual(komdigiAdmin)
    expect(canMock).toHaveBeenCalledWith('cms.update', komdigiAdmin)
  })
})
