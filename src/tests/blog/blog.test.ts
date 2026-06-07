import { blogService } from '@/features/blog/services'
import { prismaMock } from '../prisma-mock'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { PostStatus } from '@prisma/client'

jest.mock('@/core/authorization/rbac', () => ({
  can: jest.fn()
}))

describe('Blog Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb)
      }
      return cb(prismaMock)
    })
  })

  describe('createPost', () => {
    it('should create post as draft', async () => {
      prismaMock.category.findFirst.mockResolvedValueOnce({ id: 'cat-1' } as unknown as { id: string })
      prismaMock.post.create.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.DRAFT } as unknown as { id: string; status: PostStatus })

      const result = await blogService.createPost({
        title: 'Test',
        content: 'Content',
        thumbnailUrl: 'url',
        categoryName: 'General',
        tags: []
      }, 'author-1', 'dept-1')

      expect(result.id).toBe('post-1')
      expect(prismaMock.post.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: PostStatus.DRAFT,
          authorId: 'author-1'
        })
      }))
    })
  })

  describe('publishPost', () => {
    it('should throw NotFound if post missing', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce(null)
      await expect(blogService.publishPost('post-1', 'admin-1')).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user lacks permission', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({ id: 'post-1' } as unknown as { id: string })
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', roleId: 'staff' } as unknown as { id: string; roleId: string })
      ;(can as jest.Mock).mockResolvedValueOnce(false)

      await expect(blogService.publishPost('post-1', 'admin-1')).rejects.toThrow(ForbiddenError)
    })

    it('should update post to published and set publishedAt', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.DRAFT } as unknown as { id: string; status: PostStatus })
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'admin-1', roleId: 'admin' } as unknown as { id: string; roleId: string })
      ;(can as jest.Mock).mockResolvedValueOnce(true)

      prismaMock.post.update.mockResolvedValueOnce({ id: 'post-1', status: PostStatus.PUBLISHED } as unknown as { id: string; status: PostStatus })

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
})
