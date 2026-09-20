import { prisma } from '@/core/database/prisma'
import { requirePermission } from '@/core/authorization/guards'
import { PUBLICATION_CATEGORY_SLUGS } from './schemas'

export const categoryQueries = {
  async getPublicationCategories() {
    await requirePermission('post.view')
    return prisma.category.findMany({
      where: { deletedAt: null, slug: { in: [...PUBLICATION_CATEGORY_SLUGS] } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })
  },
  async getAllCategories() {
    await requirePermission('cms.view')
    return prisma.category.findMany({
      where: { deletedAt: null, slug: { in: [...PUBLICATION_CATEGORY_SLUGS] } },
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
