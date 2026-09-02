/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

jest.mock('@/core/database/prisma', () => ({
  prisma: {
    post: { findMany: jest.fn() },
    category: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/features/cms/access', () => ({
  requirePermission: jest.fn(),
  requirePublisher: jest.fn(),
  isKomdigi: jest.fn(),
}))

jest.mock('@/core/authorization/rbac', () => ({
  can: jest.fn(),
}))

jest.mock('@/core/events', () => ({
  eventBus: {
    emit: jest.fn(),
    on: jest.fn(),
  },
}))

jest.mock('../queries', () => ({
  postQueries: { getPostOwnershipById: jest.fn() },
}))

import { prisma } from '@/core/database/prisma'
import { requirePermission, isKomdigi } from '@/features/cms/access'
import { can } from '@/core/authorization/rbac'
import { eventBus } from '@/core/events'
import { postQueries } from '../queries'
import { blogService } from '../services'

describe('Blog workflow', () => {
  const actor = { id: 'user-1', departmentId: 'komdigi', roleId: 'admin_komdigi' }
  const input = {
    title: 'Artikel Pengujian',
    slug: 'artikel-pengujian',
    categoryId: 'category-1',
    authorName: 'Penulis Pengujian',
    content: 'Konten artikel pengujian yang memenuhi batas minimum.',
    featuredImage: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a draft post, records an audit entry, and emits the workflow event', async () => {
    requirePermission.mockResolvedValue(actor)
    isKomdigi.mockReturnValue(true)
    can.mockResolvedValue(false)
    prisma.post.findMany.mockResolvedValue([])
    prisma.category.findFirst.mockResolvedValue({ id: 'category-1', name: 'Opini', slug: 'opini' })
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', name: 'Admin Komdigi' })

    const createdPost = { id: 'post-1', ...input, status: 'DRAFT' }
    const tx = {
      post: { create: jest.fn().mockResolvedValue(createdPost) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    }
    prisma.$transaction.mockImplementation(async (callback) => callback(tx))

    const result = await blogService.createPost(input, actor)

    expect(tx.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        slug: 'artikel-pengujian',
        status: 'DRAFT',
        createdBy: 'user-1',
      }),
    }))
    expect(tx.auditLog.create).toHaveBeenCalled()
    expect(eventBus.emit).toHaveBeenCalledWith('post.created', {
      postId: 'post-1',
      authorId: 'user-1',
    })
    expect(result.id).toBe('post-1')
  })

  it('keeps the slug stable when a published post is edited', async () => {
    requirePermission.mockResolvedValue(actor)
    isKomdigi.mockReturnValue(true)
    postQueries.getPostOwnershipById.mockResolvedValue({
      id: 'post-published',
      authorId: actor.id,
      author: { departmentId: 'komdigi' },
      status: 'PUBLISHED',
      slug: 'url-lama',
    })
    const tx = {
      post: { update: jest.fn().mockResolvedValue({ id: 'post-published', slug: 'url-lama' }) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    }
    prisma.$transaction.mockImplementation(async (callback) => callback(tx))

    await blogService.updatePost({ id: 'post-published', title: 'Judul baru', slug: 'judul-baru' }, actor)

    expect(tx.post.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ title: 'Judul baru', slug: undefined }),
    }))
  })

  it('applies server-side article sanitization on CMS create and update', async () => {
    requirePermission.mockResolvedValue(actor)
    isKomdigi.mockReturnValue(true)
    prisma.post.findMany.mockResolvedValue([])
    prisma.category.findFirst.mockResolvedValue({ id: 'category-1', name: 'Opini', slug: 'opini' })
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', name: 'Admin Komdigi' })
    const createTx = { post: { create: jest.fn().mockResolvedValue({ id: 'post-new' }) }, auditLog: { create: jest.fn().mockResolvedValue({}) } }
    prisma.$transaction.mockImplementationOnce(async (callback) => callback(createTx))

    await blogService.createPost({ ...input, content: '<h1>Judul baru</h1><img src="data:image/png;base64,AAAA" alt="Tidak boleh"><p onclick="alert(1)">Aman</p>' }, actor)

    expect(createTx.post.create.mock.calls[0][0].data.content).toContain('<h2>Judul baru</h2>')
    expect(createTx.post.create.mock.calls[0][0].data.content).not.toMatch(/data:image|onclick|<img/i)

    postQueries.getPostOwnershipById.mockResolvedValue({ id: 'post-existing', authorId: actor.id, author: { departmentId: 'komdigi' }, status: 'DRAFT' })
    const updateTx = { post: { update: jest.fn().mockResolvedValue({ id: 'post-existing', slug: 'artikel-pengujian' }) }, auditLog: { create: jest.fn().mockResolvedValue({}) } }
    prisma.$transaction.mockImplementationOnce(async (callback) => callback(updateTx))

    await blogService.updatePost({ id: 'post-existing', content: '<h1>Heading lama</h1><h4>Subbagian lama</h4><img src="https://res.cloudinary.com/ikmi/image/upload/v1/a.png" alt="Gambar aman" onerror="alert(1)">' }, actor)

    expect(updateTx.post.update.mock.calls[0][0].data.content).toContain('<h1>Heading lama</h1><h4>Subbagian lama</h4>')
    expect(updateTx.post.update.mock.calls[0][0].data.content).toContain('src="https://res.cloudinary.com/ikmi/image/upload/v1/a.png"')
    expect(updateTx.post.update.mock.calls[0][0].data.content).not.toContain('onerror')
  })
})
