import { PostStatus, Prisma } from '@prisma/client'
import { postQueries } from './queries'
import { PostCreateInput, PostUpdateInput, postCreateSchema, postUpdateSchema } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ValidationError, ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'
import { isKomdigi, requirePermission, requirePublisher } from '@/features/cms/access'
import { SessionUser } from '@/core/authorization/rbac'
import { isSuperAdminRole } from '@/core/auth/roles'
import DOMPurify from 'isomorphic-dompurify'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const publicationCategorySlugs = ['berita', 'opini', 'artikel', 'kajian'] as const

function isAllowedPublicationCategory(category: { name: string; slug: string }) {
  return publicationCategorySlugs.includes(category.slug.trim().toLowerCase() as typeof publicationCategorySlugs[number])
}

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
    const actorRecord = await requirePermission('post.create', actor.id)
    const validated = postCreateSchema.parse(data)
    const actorIsKomdigi = isKomdigi(actorRecord)
    const isGlobal = isSuperAdminRole(actorRecord.roleId)
    if (!actorIsKomdigi && !isGlobal) throw new ForbiddenError('Publikasi hanya dapat dibuat oleh Admin Komdigi.')
    // Akun dashboard tetap menjadi pemilik internal post. Nama yang tampil
    // publik dapat ditulis bebas untuk kredit penulis/kontributor.
    const authorId = actor.id

    const [uniqueSlug, category, author] = await Promise.all([
      resolveUniqueSlug(validated.slug),
      prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } }),
      prisma.user.findFirst({ where: { id: authorId, deletedAt: null, isActive: true } }),
    ])

    if (!category) {
      throw new ValidationError('Kategori tidak ditemukan.')
    }
    if (!isAllowedPublicationCategory(category)) {
      throw new ValidationError('Kategori publikasi harus BERITA, OPINI, ARTIKEL, atau KAJIAN.')
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
            content: DOMPurify.sanitize(validated.content),
            excerpt: validated.excerpt,
            thumbnailUrl: validated.featuredImage || '',
            thumbnailPublicId: validated.featuredImagePublicId || null,
            ogImageUrl: validated.ogImage || null,
            ogImagePublicId: validated.ogImagePublicId || null,
            seoTitle: validated.seoTitle,
            seoDescription: validated.seoDescription,
            seoKeywords: validated.seoKeywords,
            authorId,
            authorName: validated.authorName || author.name,
            categoryId: category.id,
            programId: validated.programId || null,
            agendaId: validated.agendaId || null,
            // Publication state is changed only through dedicated workflow actions.
            status: PostStatus.DRAFT,
            scheduledAt: null,
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
    const actor = await requirePermission('post.update', user.id)
    const validated = postUpdateSchema.parse(data)
    const post = await postQueries.getPostOwnershipById(validated.id)

    if (!post) {
      throw new NotFoundError('Post tidak ditemukan.')
    }

    const komdigi = isKomdigi(actor)
    const isGlobal = isSuperAdminRole(actor.roleId)
    if (!komdigi && !isGlobal) throw new ForbiddenError('Publikasi hanya dapat diubah oleh Admin Komdigi.')

    if (!canManagePost(actor, post, komdigi, isGlobal)) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk mengubah artikel ini.')
    }

    if (post.status === PostStatus.PUBLISHED && !komdigi && !isGlobal) {
      throw new ForbiddenError('Artikel terbit hanya dapat diubah oleh editor Komdigi.')
    }

    // A published URL is a public contract. Existing editor submissions may
    // still contain an auto-generated slug after a title edit, so ignore it
    // once the post is published rather than silently changing the URL.
    const nextSlug = post.status === PostStatus.PUBLISHED || !validated.slug
      ? undefined
      : await resolveUniqueSlug(validated.slug, post.id)

    if (validated.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: validated.categoryId, deletedAt: null } })
      if (!category) throw new ValidationError('Kategori tidak ditemukan.')
      if (!isAllowedPublicationCategory(category)) {
        throw new ValidationError('Kategori publikasi harus BERITA, OPINI, ARTIKEL, atau KAJIAN.')
      }
    }

    return prisma.$transaction(async (tx: TxClient) => {
      try {
        const updatedPost = await tx.post.update({
          where: { id: validated.id },
          data: {
            title: validated.title,
            slug: nextSlug,
            content: validated.content ? DOMPurify.sanitize(validated.content) : undefined,
            excerpt: validated.excerpt,
            thumbnailUrl: validated.featuredImage !== undefined ? validated.featuredImage : undefined,
            thumbnailPublicId: validated.featuredImagePublicId !== undefined ? validated.featuredImagePublicId : undefined,
            ogImageUrl: validated.ogImage !== undefined ? validated.ogImage : undefined,
            ogImagePublicId: validated.ogImagePublicId !== undefined ? validated.ogImagePublicId : undefined,
            seoTitle: validated.seoTitle,
            seoDescription: validated.seoDescription,
            seoKeywords: validated.seoKeywords,
            authorName: validated.authorName,
            categoryId: validated.categoryId,
            programId: validated.programId,
            agendaId: validated.agendaId,
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
    const actor = await requirePermission('post.submit', user.id)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const isGlobal = isSuperAdminRole(actor.roleId)
    if (!isKomdigi(actor) && !isGlobal) throw new ForbiddenError('Publikasi hanya dapat dikelola oleh Admin Komdigi.')
    if (!canManagePost(actor, post, isKomdigi(actor), isGlobal)) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk submit artikel ini.')
    }

    if (post.status !== PostStatus.DRAFT && post.status !== PostStatus.REVISION) {
      throw new ValidationError('Hanya artikel DRAFT atau REVISION yang dapat diajukan review.')
    }

    const updatedPost = await prisma.$transaction(async (tx: TxClient) => {
      const result = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PENDING_REVIEW,
          revisionNotes: null,
          updatedBy: actor.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Post',
          entityId: postId,
          userId: actor.id,
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

    const isGlobal = isSuperAdminRole(reviewer.roleId)
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

  async requestRevision(postId: string, notes: string, reviewerId: string) {
    const reviewer = await requirePublisher(reviewerId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')
    if (post.status !== PostStatus.PENDING_REVIEW) {
      throw new ValidationError('Hanya artikel yang sedang direview yang dapat dikembalikan untuk revisi.')
    }
    const cleanNotes = notes.trim()
    if (cleanNotes.length < 5 || cleanNotes.length > 3000) {
      throw new ValidationError('Catatan revisi harus 5–3000 karakter.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const revisedPost = await tx.post.update({
        where: { id: postId },
        data: { status: PostStatus.REVISION, revisionNotes: cleanNotes, reviewedBy: reviewer.id, reviewedAt: new Date(), updatedBy: reviewer.id },
      })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'Post', entityId: postId, userId: reviewer.id, oldData: JSON.stringify(post), newData: JSON.stringify({ workflowAction: 'REQUEST_REVISION', status: PostStatus.REVISION, revisionNotes: cleanNotes }) },
      })
      return revisedPost
    })
  },

  async schedulePost(postId: string, scheduledAt: Date, publisherId: string) {
    const publisher = await requirePublisher(publisherId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')
    if (post.status !== PostStatus.APPROVED) throw new ValidationError('Hanya artikel APPROVED yang dapat dijadwalkan.')
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new ValidationError('Jadwal publikasi harus berada di masa mendatang.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const scheduledPost = await tx.post.update({ where: { id: postId }, data: { status: PostStatus.SCHEDULED, scheduledAt, updatedBy: publisher.id } })
      if (post.writingSubmissionId) await tx.karyaTulis.updateMany({ where: { id: post.writingSubmissionId, deletedAt: null }, data: { status: 'SCHEDULED', updatedBy: publisher.id } })
      await tx.auditLog.create({ data: { action: 'UPDATE', entity: 'Post', entityId: postId, userId: publisher.id, oldData: JSON.stringify(post), newData: JSON.stringify({ workflowAction: 'SCHEDULE', ...scheduledPost }) } })
      return scheduledPost
    })
  },

  async publishPost(postId: string, publisherId: string) {
    const publisher = await requirePublisher(publisherId)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const isGlobal = isSuperAdminRole(publisher.roleId)
    if (!isGlobal && !isKomdigi(publisher) && post.author.departmentId !== publisher.departmentId) {
      throw new ForbiddenError('Publisher hanya dapat publish artikel departemennya.')
    }

    if (post.status !== PostStatus.APPROVED && post.status !== PostStatus.SCHEDULED) {
      throw new ValidationError('Artikel harus APPROVED atau SCHEDULED sebelum dipublish.')
    }
    if (post.status === PostStatus.SCHEDULED && post.scheduledAt && post.scheduledAt.getTime() > Date.now()) {
      throw new ValidationError('Waktu publikasi terjadwal belum tiba.')
    }

    const publishedPost = await prisma.$transaction(async (tx: TxClient) => {
      const publishedPost = await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedBy: publisherId,
          publishedAt: new Date(),
          scheduledAt: post.scheduledAt,
          updatedBy: publisherId,
        },
      })
      if (post.writingSubmissionId) await tx.karyaTulis.updateMany({ where: { id: post.writingSubmissionId, deletedAt: null }, data: { status: 'PUBLISHED', publishedAt: new Date(), updatedBy: publisherId } })

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

    const isGlobal = isSuperAdminRole(actor.roleId)
    if (!isGlobal && !isKomdigi(actor) && post.author.departmentId !== actor.departmentId) {
      throw new ForbiddenError('Publisher hanya dapat archive artikel departemennya.')
    }

    if (post.status === PostStatus.ARCHIVED) {
      throw new ValidationError('Artikel sudah diarsipkan.')
    }
    if (post.status !== PostStatus.PUBLISHED) {
      throw new ValidationError('Hanya artikel PUBLISHED yang dapat diarsipkan.')
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
      if (post.writingSubmissionId) await tx.karyaTulis.updateMany({ where: { id: post.writingSubmissionId, deletedAt: null }, data: { status: 'ARCHIVED', updatedBy: userId } })

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
    const actor = await requirePermission('post.delete', user.id)
    const post = await postQueries.getPostOwnershipById(postId)
    if (!post) throw new NotFoundError('Post tidak ditemukan.')

    const isGlobal = isSuperAdminRole(actor.roleId)
    if (!canManagePost(actor, post, isKomdigi(actor), isGlobal)) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk menghapus artikel ini.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const deletedPost = await tx.post.update({
        where: { id: postId },
        data: {
          deletedAt: new Date(),
          updatedBy: actor.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Post',
          entityId: postId,
          userId: actor.id,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(deletedPost),
        },
      })

      return deletedPost
    })
  },
}
