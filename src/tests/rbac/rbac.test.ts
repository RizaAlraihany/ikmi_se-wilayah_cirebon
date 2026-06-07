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
      departmentId: 'dept1'
    })
    expect(result).toBe(true)
    expect(prismaMock.rolePermission.findFirst).not.toHaveBeenCalled()
  })

  it('should return cached result if cache hits', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(true)

    const result = await can('finance.approve.tier1', {
      id: '2',
      roleId: 'bendum',
      departmentId: 'dept1'
    })

    expect(result).toBe(true)
    expect(permissionCache.get).toHaveBeenCalledWith('bendum:finance.approve.tier1')
    expect(prismaMock.rolePermission.findFirst).not.toHaveBeenCalled()
  })

  it('should query db and return true if role has permission', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(null)
    prismaMock.rolePermission.findFirst.mockResolvedValueOnce({ 
      id: 'rp-1', 
      roleId: 'admin', 
      permissionId: 'p-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    const result = await can('report.view', {
      id: '3',
      roleId: 'admin',
      departmentId: 'dept1'
    })
    
    expect(result).toBe(true)
    expect(prismaMock.rolePermission.findFirst).toHaveBeenCalledWith({
      where: {
        roleId: 'admin',
        permission: { name: 'report.view' }
      }
    })
    expect(permissionCache.set).toHaveBeenCalledWith('admin:report.view', true, 300)
  })

  it('should return false if role does not have permission', async () => {
    ;(permissionCache.get as jest.Mock).mockResolvedValueOnce(null)
    prismaMock.rolePermission.findFirst.mockResolvedValueOnce(null)
    
    const result = await can('finance.approve', {
      id: '4',
      roleId: 'staff',
      departmentId: 'dept1'
    })
    
    expect(result).toBe(false)
    expect(permissionCache.set).toHaveBeenCalledWith('staff:finance.approve', false, 300)
  })
})
