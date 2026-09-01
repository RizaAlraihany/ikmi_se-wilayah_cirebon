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
})
