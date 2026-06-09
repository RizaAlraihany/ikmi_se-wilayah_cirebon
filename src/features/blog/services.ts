import { PostStatus } from '@prisma/client'
import { postRepository } from './repository'
import { postQueries } from './queries'
import { PostCreateInput, PostUpdateInput, postCreateSchema, postUpdateSchema } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ValidationError, ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import { isKomdigi, isSuperAdmin, requirePermission, requirePublisher } from '@/features/cms/access'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
type SessionUser = { id: string; departmentId: string | null; roleId: string }

function canManagePost(user: SessionUser, post: { authorId: string; author: { departmentId: string | null } }, komdigi: boolean) {
  if (isSuperAdmin(user)) return true
  if (komdigi && post.author.departmentId === user.departmentId) return true
  return post.authorId === user.id
}

export const blogService = {
  async createPost(data: PostCreateInput, authorId: string, departmentId: string | null) {
    const validated = postCreateSchema.parse(data)
    await requirePermission('post.create', authorId)

    if (!departmentId) {
      throw new ForbiddenError('Hanya pengguna dengan departemen yang dapat membuat artikel.')
    }

    const [existingSlug, category] = await Promise.all([
      postRepository.findBySlug(validated.slug),
      prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } }),
    ])

    if (existingSlug) {
      throw new ValidationError('Slug sudah digunakan. Silakan pilih judul lain.')
    }

    if (!category) {
      throw new ValidationError('Kategori tidak ditemukan.')
    }

    const newPost = await prisma.$transaction(async (tx: TxClient) => {
      const newPost = await tx.post.create({
        data: {
          title: validated.title,
          slug: validated.slug,
          content: validated.content,
          excerpt: validated.excerpt,
          thumbnailUrl: validated.featuredImage || '',
          seoTitle: validated.seoTitle,
          seoDescription: validated.seoDescription,
          seoKeywords: validated.seoKeywords,
          authorId,
          categoryId: category.id,
          status: PostStatus.DRAFT,
          createdBy: authorId,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Post',
          entityId: newPost.id,
          userId: authorId,
          newData: JSON.stringify(newPost),
        },
      })

      return newPost
    })

    await eventBus.emit('post.created', { postId: newPost.id, authorId })
    return newPost
  },

  async updatePost(data: PostUpdateInput, user: SessionUser) {
    const validated = postUpdateSchema.parse(data)
    const post = await postQueries.getPostOwnershipById(validated.id)

    if (!post) {
      throw new NotFoundError('Post tidak ditemukan.')
    }

    const actor = await requirePermission('post.update', user.id)
    const komdigi = isKomdigi(actor)

    if (!canManagePost(user, post, komdigi)) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk mengubah artikel ini.')
    }

    if (post.status === PostStatus.PUBLISHED && !komdigi && !isSuperAdmin(user)) {
      throw new ForbiddenError('Artikel terbit hanya dapat diubah oleh editor Komdigi.')
    }

    if (validated.slug && validated.slug !== post.slug) {
      const existingSlug = await postRepository.findBySlug(validated.slug)
      if (existingSlug) {
        throw new ValidationError('Slug sudah digunakan. Silakan pilih judul lain.')
      }
    }

    if (validated.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } })
      if (!category) throw new ValidationError('Kategori tidak ditemukan.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updatedPost = await tx.post.update({
        where: { id: validated.id },
        data: {
          title: validated.title,
          slug: validated.slug,
          content: validated.content,
          excerpt: validated.excerpt,
          thumbnailUrl: validated.featuredImage !== undefined ? validated.featuredImage : undefined,
          categoryId: validated.categoryId,
          seoTitle: validated.seoTitle,
          seoDescription: validated.seoDescription,
          seoKeywords: validated.seoKeywords,
          updatedBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Post',
          entityId: updatedPost.id,
          userId: user.id,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(updatedPost),
        },
      })

      return updatedPost
    })
  },

  async submitForReview(postId: string, user: SessionUser) {
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const actor = await requirePermission('post.submit', user.id)
    if (!canManagePost(user, post, isKomdigi(actor))) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk submit artikel ini.')
    }

    if (post.status !== PostStatus.DRAFT) {
      throw new ValidationError('Hanya artikel DRAFT yang dapat diajukan review.')
    }

    const updatedPost = await prisma.$transaction(async (tx: TxClient) => {
      const result = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PENDING_REVIEW,
          updatedBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Post',
          entityId: postId,
          userId: user.id,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(result),
        },
      })

      return result
    })

    await eventBus.emit('post.submitted', {
      postId,
      authorId: post.authorId,
    })

    return updatedPost
  },

  async approvePost(postId: string, reviewerId: string) {
    const reviewer = await requirePublisher(reviewerId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    if (!isSuperAdmin(reviewer) && post.author.departmentId !== reviewer.departmentId) {
      throw new ForbiddenError('Editor hanya dapat review artikel departemennya.')
    }

    if (post.status !== PostStatus.PENDING_REVIEW) {
      throw new ValidationError('Hanya artikel PENDING_REVIEW yang dapat disetujui.')
    }

    const approvedPost = await prisma.$transaction(async (tx: TxClient) => {
      const approvedPost = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          updatedBy: reviewerId,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'APPROVE',
          entity: 'Post',
          entityId: postId,
          userId: reviewerId,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(approvedPost),
        },
      })

      return approvedPost
    })

    await eventBus.emit('post.approved', {
      postId,
      reviewerId,
      authorId: post.authorId,
    })

    return approvedPost
  },

  async publishPost(postId: string, publisherId: string) {
    const publisher = await requirePublisher(publisherId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    if (!isSuperAdmin(publisher) && post.author.departmentId !== publisher.departmentId) {
      throw new ForbiddenError('Publisher hanya dapat publish artikel departemennya.')
    }

    if (post.status !== PostStatus.APPROVED) {
      throw new ValidationError('Artikel harus APPROVED sebelum dipublish.')
    }

    const publishedPost = await prisma.$transaction(async (tx: TxClient) => {
      const publishedPost = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedBy: publisherId,
          publishedAt: new Date(),
          updatedBy: publisherId,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'PUBLISH',
          entity: 'Post',
          entityId: postId,
          userId: publisherId,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(publishedPost),
        },
      })

      return publishedPost
    })

    await eventBus.emit('post.published', {
      postId,
      publisherId,
      authorId: post.authorId,
    })

    return publishedPost
  },

  async archivePost(postId: string, userId: string) {
    const actor = await requirePublisher(userId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    if (!isSuperAdmin(actor) && post.author.departmentId !== actor.departmentId) {
      throw new ForbiddenError('Publisher hanya dapat archive artikel departemennya.')
    }

    if (post.status === PostStatus.ARCHIVED) {
      throw new ValidationError('Artikel sudah diarsipkan.')
    }

    const archivedPost = await prisma.$transaction(async (tx: TxClient) => {
      const archivedPost = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.ARCHIVED,
          archivedAt: new Date(),
          updatedBy: userId,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'ARCHIVE',
          entity: 'Post',
          entityId: postId,
          userId,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(archivedPost),
        },
      })

      return archivedPost
    })

    await eventBus.emit('post.archived', {
      postId,
      userId,
      authorId: post.authorId,
    })

    return archivedPost
  },

  async deletePost(postId: string, user: SessionUser) {
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const actor = await requirePermission('post.delete', user.id)
    if (!canManagePost(user, post, isKomdigi(actor))) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk menghapus artikel ini.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const deletedPost = await tx.post.update({
        where: { id: postId },
        data: {
          deletedAt: new Date(),
          updatedBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Post',
          entityId: postId,
          userId: user.id,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(deletedPost),
        },
      })

      return deletedPost
    })
  },
}
