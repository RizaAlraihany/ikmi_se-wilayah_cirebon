/* eslint-disable @typescript-eslint/no-explicit-any */
import { can } from '@/core/authorization/rbac'
import { prismaMock } from '../prisma-mock'
import { permissionCache } from '@/core/cache/permission-cache'

jest.mock('@/core/cache/permission-cache', () => ({
  permissionCache: {
    get: jest.fn(),
    set: jest.fn(),
  }
}))

describe('RBAC - can()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return false if user is null', async () => {
    const result = await can('any.permission', null)
    expect(result).toBe(false)
  })

  it('should bypass and return true if user is super_admin', async () => {
    const result = await can('forbidden.permission', {
      id: '1',
      roleId: 'super_admin',
      departmentId: 'dept1', positionId: null
    })
    expect(result).toBe(true)
    expect(prismaMock.rolePermission.findUnique).not.toHaveBeenCalled()
  })

  it('should return cached result if cache hits', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(true)

    const result = await can('finance.approve_tier1', {
      id: '2',
      roleId: 'admin_bendahara',
      departmentId: 'dept1', positionId: null
    })

    expect(result).toBe(true)
    expect(permissionCache.get).toHaveBeenCalledWith('rbac:v2:admin_bendahara:finance.approve_tier1')
    expect(prismaMock.rolePermission.findUnique).not.toHaveBeenCalled()
  })

  it('should query db and return true if role has permission', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(null)
    prismaMock.rolePermission.findUnique.mockResolvedValueOnce({ 
       
      roleId: 'admin', 
      permissionId: 'p-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    
    const result = await can('report.view', {
      id: '3',
      roleId: 'admin',
      departmentId: 'dept1', positionId: null
    })
    
    expect(result).toBe(true)
    expect(prismaMock.rolePermission.findUnique).toHaveBeenCalledWith({
      where: {
        roleId_permissionId: {
          roleId: 'admin',
          permissionId: 'report.view'
        }
      }
    })
    expect(permissionCache.set).toHaveBeenCalledWith('rbac:v2:admin:report.view', true, 300)
  })

  it('should return false if role does not have permission', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(null)
    prismaMock.rolePermission.findUnique.mockResolvedValueOnce(null)
    
    const result = await can('finance.approve', {
      id: '4',
      roleId: 'staff',
      departmentId: 'dept1', positionId: null
    })
    
    expect(result).toBe(false)
    expect(permissionCache.set).toHaveBeenCalledWith('rbac:v2:staff:finance.approve', false, 300)
  })
})

