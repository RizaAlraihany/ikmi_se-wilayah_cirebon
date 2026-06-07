import { postRepository } from './repositories'
import { postQueries } from './queries'
import { PostCreateInput, PostUpdateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ValidationError, ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const blogService = {
  async createPost(data: PostCreateInput, authorId: string, departmentId: string) {
    // Ownership validation: Ensure author has a department (e.g. Komdigi or Hubmas)
    if (!departmentId) {
      throw new ForbiddenError('Hanya pengguna dengan departemen yang dapat membuat artikel.')
    }

    const existingSlug = await postRepository.findBySlug(data.slug)
    if (existingSlug) {
      throw new ValidationError('Slug sudah digunakan. Silakan pilih judul lain.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const newPost = await tx.post.create({
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content,
          thumbnailUrl: data.featuredImage || '',
          authorId,
          categoryId: (await tx.category.findFirst())?.id || (await tx.category.create({ data: { name: 'Umum', slug: 'umum', description: 'Kategori Umum' } })).id,
          status: 'DRAFT', // Default status is DRAFT until published
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Post',
          entityId: newPost.id,
          userId: authorId,
          newData: JSON.stringify(newPost)
        }
      })

      // Emit event
      await eventBus.emit('post.submitted', {
        postId: newPost.id,
        authorId: authorId,
      })

      return newPost
    })
  },

  async updatePost(data: PostUpdateInput, user: { id: string, departmentId: string, roleId: string }) {
    const post = await postQueries.getPostOwnershipById(data.id)
    
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan.')
    }

    if (user.roleId !== 'super_admin' && post.author.departmentId !== user.departmentId) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk mengubah artikel dari departemen lain.')
    }

    if (data.slug && data.slug !== post.slug) {
      const existingSlug = await postRepository.findBySlug(data.slug)
      if (existingSlug) {
        throw new ValidationError('Slug sudah digunakan. Silakan pilih judul lain.')
      }
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updatedPost = await tx.post.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content,
          thumbnailUrl: data.featuredImage || undefined,
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Post',
          entityId: updatedPost.id,
          userId: user.id,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(updatedPost)
        }
      })

      return updatedPost
    })
  },

  async publishPost(postId: string, publisherId: string) {
    const post = await postRepository.findActive({ where: { id: postId } }).then(res => res[0])
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const publishedPost = await tx.post.update({
        where: { id: postId },
        data: { 
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'PUBLISH',
          entity: 'Post',
          entityId: publishedPost.id,
          userId: publisherId,
          oldData: JSON.stringify(post),
          newData: JSON.stringify(publishedPost)
        }
      })

      return publishedPost
    })
  }
}
