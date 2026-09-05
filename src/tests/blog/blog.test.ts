/* eslint-disable @typescript-eslint/no-explicit-any */
import { blogService } from '@/features/blog/services'
import { prismaMock } from '../prisma-mock'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { PostStatus } from '@prisma/client'

jest.mock('@/core/authorization/rbac', () => ({
  can: jest.fn()
}))

describe('Blog Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(can as jest.Mock).mockResolvedValue(true)
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb)
      }
      return cb(prismaMock)
    })
  })

  describe('createPost', () => {
    it('should create post as draft', async () => {
      prismaMock.user.findFirst
        .mockResolvedValueOnce({
          id: 'author-1',
          roleId: 'admin_komdigi',
          department: { code: 'KOMDIGI', name: 'Komunikasi & Digitalisasi' },
        } as any)
        .mockResolvedValueOnce({ id: 'author-1' } as any)
      prismaMock.post.findMany.mockResolvedValueOnce([] as any)
      prismaMock.category.findFirst.mockResolvedValueOnce({ id: 'cat-1', name: 'Opini', slug: 'opini' } as any)
      prismaMock.post.create.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.DRAFT } as any)

      const result = await blogService.createPost({
        title: 'Test article',
        content: 'Content article valid',
        slug: 'test-slug',
        authorName: 'Penulis IKMI',
        categoryId: 'cat-1'
      }, {
        id: 'author-1',
        roleId: 'admin_komdigi',
        departmentId: 'dept-1',
        positionId: null,
      })

      expect(result.id).toBe('post-1')
      expect(prismaMock.post.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: PostStatus.DRAFT,
          authorId: 'author-1',
          ogImageUrl: null,
        })
      }))
    })
  })

  describe('publishPost', () => {
    it('should throw NotFound if post missing', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'admin-1',
        roleId: 'admin_komdigi',
        department: { code: 'KOMDIGI', name: 'Komunikasi & Digitalisasi' },
      } as any)
      prismaMock.post.findFirst.mockResolvedValueOnce(null)
      await expect(blogService.publishPost('post-1', 'admin-1')).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user lacks permission', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-1' } as any)
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'admin-1', roleId: 'admin_organization' } as any)
      ;(can as jest.Mock).mockResolvedValue(false)

      await expect(blogService.publishPost('post-1', 'admin-1')).rejects.toThrow(ForbiddenError)
    })

    it('should update post to published and set publishedAt', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.APPROVED } as any)
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'admin-1',
        roleId: 'admin_komdigi',
        department: { code: 'KOMDIGI', name: 'Komunikasi & Digitalisasi' },
      } as any)
      ;(can as jest.Mock).mockResolvedValueOnce(true)

      prismaMock.post.update.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.PUBLISHED } as any)

      const result = await blogService.publishPost('post-1', 'admin-1')

      expect(result.status).toBe(PostStatus.PUBLISHED)
      expect(prismaMock.post.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: PostStatus.PUBLISHED,
          publishedAt: expect.any(Date) as unknown as Date
        })
      }))
      expect(prismaMock.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('review and scheduling workflow', () => {
    it('stores revision instructions and its audit event atomically', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'admin-1', roleId: 'admin_komdigi', department: { code: 'KOMDIGI' } } as any)
      prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-review', status: PostStatus.PENDING_REVIEW, authorId: 'author-1', author: { departmentId: 'komdigi' } } as any)
      prismaMock.post.update.mockResolvedValueOnce({ id: 'post-review', status: PostStatus.REVISION } as any)

      await blogService.requestRevision('post-review', 'Perjelas sumber data pada paragraf kedua.', 'admin-1')

      expect(prismaMock.post.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: PostStatus.REVISION, revisionNotes: 'Perjelas sumber data pada paragraf kedua.' }) }))
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'UPDATE', entity: 'Post' }) }))
    })

    it('allows only a future schedule from Approved and blocks early scheduled publication', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-12T05:00:00.000Z'))
      try {
        prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'admin-1', roleId: 'admin_komdigi', department: { code: 'KOMDIGI' } } as any)
        prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-approved', status: PostStatus.APPROVED, author: { departmentId: 'komdigi' } } as any)
        prismaMock.post.update.mockResolvedValueOnce({ id: 'post-approved', status: PostStatus.SCHEDULED } as any)
        await blogService.schedulePost('post-approved', new Date('2026-08-13T05:00:00.000Z'), 'admin-1')
        expect(prismaMock.post.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: PostStatus.SCHEDULED }) }))

        prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'admin-1', roleId: 'admin_komdigi', department: { code: 'KOMDIGI' } } as any)
        prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-scheduled', status: PostStatus.SCHEDULED, scheduledAt: new Date('2026-08-13T05:00:00.000Z'), author: { departmentId: 'komdigi' } } as any)
        await expect(blogService.publishPost('post-scheduled', 'admin-1')).rejects.toBeInstanceOf(ValidationError)
      } finally {
        jest.useRealTimers()
      }
    })
  })
})
