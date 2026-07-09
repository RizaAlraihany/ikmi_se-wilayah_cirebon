import { PostStatus, Prisma } from '@prisma/client'
import { postQueries } from './queries'
import { PostCreateInput, PostUpdateInput, postCreateSchema, postUpdateSchema } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ValidationError, ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import { isKomdigi, requirePermission, requirePublisher } from '@/features/cms/access'
import { can, SessionUser } from '@/core/authorization/rbac'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

function canManagePost(user: SessionUser, post: { authorId: string; author: { departmentId: string | null } }, komdigi: boolean, isGlobal: boolean) {
  if (isGlobal) return true
  if (komdigi) return true
  return post.authorId === user.id
}

async function resolveUniqueSlug(slug: string, currentPostId?: string) {
  const matchingPosts = await prisma.post.findMany({
    where: {
      OR: [
        { slug },
        { slug: { startsWith: `${slug}-` } },
      ],
    },
    select: {
      id: true,
      slug: true,
    },
  })
  const usedSlugs = new Set(
    matchingPosts
      .filter((post) => post.id !== currentPostId)
      .map((post) => post.slug),
  )

  if (!usedSlugs.has(slug)) return slug

  let suffix = 2
  let nextSlug = `${slug}-${suffix}`
  while (usedSlugs.has(nextSlug)) {
    suffix += 1
    nextSlug = `${slug}-${suffix}`
  }

  return nextSlug
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export const blogService = {
  async createPost(data: PostCreateInput, actor: SessionUser) {
    const validated = postCreateSchema.parse(data)
    const actorRecord = await requirePermission('post.create', actor.id)
    const actorIsKomdigi = isKomdigi(actorRecord)
    const isGlobal = await can('system.manage', actorRecord as SessionUser)
    const authorId = validated.authorId || actor.id

    if (!isGlobal && !actorIsKomdigi && authorId !== actor.id) {
      throw new ForbiddenError('Anda hanya dapat membuat artikel atas nama akun sendiri.')
    }

    const [uniqueSlug, category, author] = await Promise.all([
      resolveUniqueSlug(validated.slug),
      prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } }),
      prisma.user.findFirst({ where: { id: authorId, deletedAt: null, isActive: true } }),
    ])

    if (!category) {
      throw new ValidationError('Kategori tidak ditemukan.')
    }

    if (!author) {
      throw new ValidationError('Author tidak ditemukan atau tidak aktif.')
    }

    const newPost = await prisma.$transaction(async (tx: TxClient) => {
      try {
        const newPost = await tx.post.create({
          data: {
            title: validated.title,
            slug: uniqueSlug,
            content: validated.content,
            excerpt: validated.excerpt,
            thumbnailUrl: validated.featuredImage || '',
            thumbnailPublicId: validated.featuredImagePublicId || null,
            seoTitle: validated.seoTitle,
            seoDescription: validated.seoDescription,
            seoKeywords: validated.seoKeywords,
            authorId,
            categoryId: category.id,
            status: PostStatus.DRAFT,
            createdBy: actor.id,
          },
        })

        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Post',
            entityId: newPost.id,
            userId: actor.id,
            newData: JSON.stringify(newPost),
          },
        })

        return newPost
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ValidationError('Slug sudah digunakan. Silakan ubah slug artikel.')
        }
        throw error
      }
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
    const isGlobal = await can('system.manage', user as SessionUser)

    if (!canManagePost(user, post, komdigi, isGlobal)) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk mengubah artikel ini.')
    }

    if (post.status === PostStatus.PUBLISHED && !komdigi && !isGlobal) {
      throw new ForbiddenError('Artikel terbit hanya dapat diubah oleh editor Komdigi.')
    }

    const nextSlug = validated.slug ? await resolveUniqueSlug(validated.slug, post.id) : undefined

    if (validated.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } })
      if (!category) throw new ValidationError('Kategori tidak ditemukan.')
    }

    if (validated.authorId) {
      const author = await prisma.user.findFirst({ where: { id: validated.authorId, deletedAt: null, isActive: true } })
      if (!author) throw new ValidationError('Author tidak ditemukan atau tidak aktif.')
      if (!isGlobal && !komdigi && validated.authorId !== user.id) {
        throw new ForbiddenError('Anda hanya dapat mengatur author ke akun sendiri.')
      }
    }

    return prisma.$transaction(async (tx: TxClient) => {
      try {
        const updatedPost = await tx.post.update({
          where: { id: validated.id },
          data: {
            title: validated.title,
            slug: nextSlug,
            content: validated.content,
            excerpt: validated.excerpt,
            thumbnailUrl: validated.featuredImage !== undefined ? validated.featuredImage : undefined,
            thumbnailPublicId: validated.featuredImagePublicId !== undefined ? validated.featuredImagePublicId || null : undefined,
            categoryId: validated.categoryId,
            authorId: validated.authorId,
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
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ValidationError('Slug sudah digunakan. Silakan ubah slug artikel.')
        }
        throw error
      }
    })
  },

  async submitForReview(postId: string, user: SessionUser) {
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const actor = (await can('post.submit', user))
      ? await requirePermission('post.submit', user.id)
      : await requirePermission('post.publish', user.id)
    const isGlobal = await can('system.manage', user as SessionUser)
    if (!canManagePost(user, post, isKomdigi(actor), isGlobal)) {
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

    const isGlobal = await can('system.manage', reviewer as SessionUser)
    if (!isGlobal && !isKomdigi(reviewer) && post.author.departmentId !== reviewer.departmentId) {
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

    const isGlobal = await can('system.manage', publisher as SessionUser)
    if (!isGlobal && !isKomdigi(publisher) && post.author.departmentId !== publisher.departmentId) {
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

    const isGlobal = await can('system.manage', actor as SessionUser)
    if (!isGlobal && !isKomdigi(actor) && post.author.departmentId !== actor.departmentId) {
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
    const isGlobal = await can('system.manage', user as SessionUser)
    if (!canManagePost(user, post, isKomdigi(actor), isGlobal)) {
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
