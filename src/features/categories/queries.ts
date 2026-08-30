import { prisma } from '@/core/database/prisma'
import { requirePermission } from '@/core/authorization/guards'

export const categoryQueries = {
  async getPublicationCategories() {
    await requirePermission('post.view')
    return prisma.category.findMany({
      where: { deletedAt: null, slug: { in: ['berita', 'opini', 'artikel', 'kajian'] } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })
  },
  async getAllCategories() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            posts: {
              where: { deletedAt: null },
            },
          }
        }
      }
    })
  },

  async getCategoryById(id: string) {
    return prisma.category.findFirst({
      where: { id, deletedAt: null }
    })
  },

  async getCategoryBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { slug, deletedAt: null }
    })
  },

  async getCategoryByName(name: string) {
    return prisma.category.findFirst({
      where: { name, deletedAt: null }
    })
  }
}
