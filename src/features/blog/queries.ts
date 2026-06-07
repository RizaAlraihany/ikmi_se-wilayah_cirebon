import { prisma } from '@/core/database/prisma'

export const postQueries = {
  async getPostOwnershipById(id: string) {
    return prisma.post.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            departmentId: true
          }
        }
      }
    })
  },

  async getPaginatedPosts(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            include: { department: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ])

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
