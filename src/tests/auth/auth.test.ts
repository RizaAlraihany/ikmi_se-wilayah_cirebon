import { authConfig } from '@/core/auth/auth.config'
import { prismaMock } from '../prisma-mock'
import bcrypt from 'bcryptjs'

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // next-auth Credentials provider is at index 0
  const credentialsProvider = authConfig.providers[0] as unknown as { authorize: (credentials: Record<string, string>) => Promise<unknown> }

  it('should return null if email or password is not provided', async () => {
    const result1 = await credentialsProvider.authorize({ email: 'test@mail.com' })
    const result2 = await credentialsProvider.authorize({ password: 'password' })
    const result3 = await credentialsProvider.authorize(undefined)
    
    expect(result1).toBeNull()
    expect(result2).toBeNull()
    expect(result3).toBeNull()
  })

  it('should return null if user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@mail.com' },
      include: { role: true, department: true }
    })
  })

  it('should return null if user is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', isActive: false, email: 'test@mail.com', passwordHash: 'hash', deletedAt: null
    } as unknown as Record<string, string>)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
  })

  it('should return null if user is soft-deleted', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', isActive: true, email: 'test@mail.com', passwordHash: 'hash', deletedAt: new Date()
    } as unknown as Record<string, string>)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
  })

  it('should return null if password does not match', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', isActive: true, email: 'test@mail.com', passwordHash: 'hash', deletedAt: null
    } as unknown as Record<string, string>)
    
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'wrongpassword' })
    expect(result).toBeNull()
  })

  it('should return user object if credentials are valid', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', 
      name: 'Test User',
      email: 'test@mail.com', 
      passwordHash: 'hash',
      isActive: true, 
      deletedAt: null,
      roleId: 'admin',
      departmentId: 'dept1'
    } as unknown as Record<string, string>)
    
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    
    expect(result).toEqual({
      id: '1',
      email: 'test@mail.com',
      name: 'Test User',
      roleId: 'admin',
      departmentId: 'dept1'
    })
  })
})
