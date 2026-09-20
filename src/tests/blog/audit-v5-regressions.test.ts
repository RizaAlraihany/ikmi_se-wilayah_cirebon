/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../prisma-mock'
import { blogService } from '@/features/blog/services'
import { postQueries } from '@/features/blog/queries'
import { categoryService } from '@/features/categories/services'
import { categoryCreateSchema } from '@/features/categories/schemas'
import { categoryQueries } from '@/features/categories/queries'
import { userCreateSchema, userUpdateSchema } from '@/features/users/schemas'
import { normalizeArticleText } from '@/app/(public)/_components/article-renderer'

jest.mock('@/core/authorization/rbac', () => ({ can: jest.fn().mockResolvedValue(true) }))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn().mockResolvedValue({ id: 'admin', roleId: 'admin_komdigi' }), requireCmsUpdate: jest.fn().mockResolvedValue({ id: 'admin', roleId: 'admin_komdigi' }) }))
jest.mock('@/features/categories/queries', () => ({
  categoryQueries: {
    getCategoryById: jest.fn(),
    getCategoryBySlug: jest.fn(),
    getCategoryByName: jest.fn(),
  }
}))

describe('PRD v5 audit regressions', () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'admin', roleId: 'admin_komdigi' } as any)
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock))
    jest.mocked(categoryQueries.getCategoryById).mockResolvedValue(null)
    jest.mocked(categoryQueries.getCategoryBySlug).mockResolvedValue(null)
    jest.mocked(categoryQueries.getCategoryByName).mockResolvedValue(null)
  })

  it('preserves a previously published URL when editing an archived article', async () => {
    prismaMock.post.findFirst.mockResolvedValue({ id: 'post', slug: 'url-awal', status: 'ARCHIVED', publishedAt: new Date(), author: { departmentId: 'komdigi' } } as any)
    prismaMock.post.update.mockResolvedValue({ id: 'post' } as any)
    await blogService.updatePost({ id: 'post', title: 'Judul revisi', slug: 'judul-revisi' }, { id: 'admin', roleId: 'admin_komdigi', departmentId: null, positionId: null })
    expect(prismaMock.post.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'Judul revisi', slug: undefined }) }))
    expect(prismaMock.post.findMany).not.toHaveBeenCalled()
  })

  it.each([-1, 1.5, NaN, Infinity])('normalizes invalid dashboard pagination %s before querying Prisma', async (page) => {
    prismaMock.post.findMany.mockResolvedValue([])
    prismaMock.post.count.mockResolvedValue(0)
    await postQueries.getPaginatedPosts(page, -10)
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }))
  })

  it('rejects out-of-scope publication categories before writes', async () => {
    expect(categoryCreateSchema.safeParse({ name: 'Acara', slug: 'acara', description: 'Kategori acara' }).success).toBe(false)
    await expect(categoryService.createCategory({ name: 'Acara', slug: 'acara', description: 'Kategori acara' } as any, 'admin')).rejects.toThrow()
    expect(prismaMock.category.create).not.toHaveBeenCalled()
  })

  it('prevents moving an in-use category out of its public filter', async () => {
    jest.mocked(categoryQueries.getCategoryById).mockResolvedValue({ id: 'ck000000000000000000000001', name: 'Berita', slug: 'berita' } as any)
    prismaMock.post.count.mockResolvedValue(2)
    await expect(categoryService.updateCategory({ id: 'ck000000000000000000000001', slug: 'opini', description: 'desc' } as any, 'admin')).rejects.toThrow()
    expect(prismaMock.category.update).not.toHaveBeenCalled()
  })

  it('enforces canonical name for category creation', async () => {
    jest.mocked(categoryQueries.getCategoryBySlug).mockResolvedValue(null)
    jest.mocked(categoryQueries.getCategoryByName).mockResolvedValue(null)
    await expect(categoryService.createCategory({ name: 'Wrong Name', slug: 'berita', description: 'Valid description' } as any, 'admin')).rejects.toThrow('Nama kategori untuk slug "berita" harus "Berita"')
    expect(prismaMock.category.create).not.toHaveBeenCalled()
  })

  it('rejects deletion of canonical categories before checking posts or writing', async () => {
    jest.mocked(categoryQueries.getCategoryById).mockResolvedValue({ id: 'ck000000000000000000000001', name: 'Berita', slug: 'berita' } as any)
    await expect(categoryService.deleteCategory('ck000000000000000000000001', 'admin')).rejects.toThrow('Kategori publikasi utama tidak dapat dihapus.')
    expect(prismaMock.post.count).not.toHaveBeenCalled()
    expect(prismaMock.category.update).not.toHaveBeenCalled()
  })

  it('preserves historical categories while allowing the existing unused-category archive path', async () => {
    jest.mocked(categoryQueries.getCategoryById).mockResolvedValue({ id: 'legacy-category', name: 'Acara', slug: 'acara' } as any)
    prismaMock.post.count.mockResolvedValue(0)
    prismaMock.category.update.mockResolvedValue({ id: 'legacy-category', slug: 'acara' } as any)
    await expect(categoryService.deleteCategory('legacy-category', 'admin')).resolves.toEqual(expect.objectContaining({ id: 'legacy-category' }))
    expect(prismaMock.category.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'legacy-category' }, data: expect.objectContaining({ deletedAt: expect.any(Date) }) }))
  })

  it('enforces canonical name for category update', async () => {
    jest.mocked(categoryQueries.getCategoryById).mockResolvedValue({ id: 'ck000000000000000000000001', name: 'Berita', slug: 'berita' } as any)
    prismaMock.category.update.mockResolvedValue({ id: 'ck000000000000000000000001', name: 'Berita', slug: 'berita', description: 'Updated description' } as any)
    await expect(categoryService.updateCategory({ id: 'ck000000000000000000000001', description: 'Updated description' } as any, 'admin')).resolves.toBeDefined()
    expect(prismaMock.category.update).toHaveBeenCalled()
  })

  it('stores account emails using the same normalization as login', () => {
    expect(userCreateSchema.parse({ name: 'Admin Test', email: ' ADMIN@EXAMPLE.TEST ', password: 'test-only-password', roleId: 'admin_komdigi', departmentId: 'komdigi' }).email).toBe('admin@example.test')
    expect(userUpdateSchema.parse({ id: 'admin', email: ' ADMIN@EXAMPLE.TEST ' }).email).toBe('admin@example.test')
  })

  it('does not crash article rendering for malformed numeric entities', () => {
    expect(() => normalizeArticleText('<h1>Arsip &#999999999; &#x110000;</h1>')).not.toThrow()
    expect(normalizeArticleText('&#65; &amp;')).toBe('a &')
  })
})
