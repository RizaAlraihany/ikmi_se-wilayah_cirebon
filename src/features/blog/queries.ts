import { prisma } from '@/core/database/prisma'
import { PostStatus } from '@prisma/client'

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
          },
          category: true,
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
  },

  async getPostForEdit(id: string) {
    return prisma.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          include: {
            department: true,
            position: true,
          },
        },
        category: true,
      },
    })
  },

  async getPublishedPosts(limit?: number) {
    return prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
        author: {
          include: {
            position: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    })
  },

  async getPublishedPostBySlug(slug: string) {
    return prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
        author: {
          include: {
            position: true,
          },
        },
      },
    })
  },

  async getAnalytics() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      byCategory,
      byAuthor,
      monthlyPublications,
    ] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { deletedAt: null, status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { deletedAt: null, status: PostStatus.DRAFT } }),
      prisma.category.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              posts: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          posts: {
            some: {
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              posts: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.post.groupBy({
        by: ['publishedAt'],
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
          publishedAt: {
            gte: startOfYear,
          },
        },
        _count: {
          id: true,
        },
      }),
    ])

    const monthly = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(new Date().getFullYear(), index, 1).toLocaleDateString('id-ID', { month: 'short' }),
      count: monthlyPublications
        .filter((item) => item.publishedAt && item.publishedAt.getMonth() === index)
        .reduce((total, item) => total + item._count.id, 0),
    }))

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      byCategory,
      byAuthor,
      monthly,
    }
  }
}
