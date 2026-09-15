/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../prisma-mock'
import { blogService } from '@/features/blog/services'
import { postQueries } from '@/features/blog/queries'
import { categoryService } from '@/features/categories/services'
import { categoryCreateSchema } from '@/features/categories/schemas'
import { userCreateSchema, userUpdateSchema } from '@/features/users/schemas'
import { normalizeArticleText } from '@/app/(public)/_components/article-renderer'

jest.mock('@/core/authorization/rbac', () => ({ can: jest.fn().mockResolvedValue(true) }))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn().mockResolvedValue({ id: 'admin', roleId: 'admin_komdigi' }) }))

describe('PRD v5 audit regressions', () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'admin', roleId: 'admin_komdigi' } as any)
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock))
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
    prismaMock.category.findFirst.mockResolvedValue({ id: 'ck000000000000000000000001', name: 'Berita', slug: 'berita' } as any)
    prismaMock.post.count.mockResolvedValue(2)
    await expect(categoryService.updateCategory({ id: 'ck000000000000000000000001', slug: 'opini' }, 'admin')).rejects.toThrow('Slug kategori yang digunakan')
    expect(prismaMock.category.update).not.toHaveBeenCalled()
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
