import { prisma } from '@/core/database/prisma'
import { CategoryCreateInput, CategoryUpdateInput, categoryCreateSchema, categoryUpdateSchema } from './schemas'
import { categoryQueries } from './queries'
import { ValidationError, NotFoundError } from '@/core/errors/custom-errors'
import { requireCmsUpdate } from '@/features/cms/access'

export const categoryService = {
  async createCategory(data: CategoryCreateInput, userId: string) {
    const validated = categoryCreateSchema.parse(data)
    
    await requireCmsUpdate(userId)

    const existingSlug = await categoryQueries.getCategoryBySlug(validated.slug)
    if (existingSlug) {
      throw new ValidationError('Slug sudah digunakan')
    }

    const existingName = await categoryQueries.getCategoryByName(validated.name)
    if (existingName) {
      throw new ValidationError('Nama kategori sudah digunakan')
    }

    return prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: validated.name,
          slug: validated.slug,
          description: validated.description,
          createdBy: userId,
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Category',
          entityId: newCategory.id,
          userId,
          newData: JSON.stringify(newCategory)
        }
      })

      return newCategory
    })
  },

  async updateCategory(data: CategoryUpdateInput, userId: string) {
    const validated = categoryUpdateSchema.parse(data)
    if (!validated.id) throw new ValidationError('ID tidak valid')

    await requireCmsUpdate(userId)

    const existing = await categoryQueries.getCategoryById(validated.id)
    if (!existing) throw new NotFoundError('Kategori tidak ditemukan')

    if (validated.slug && validated.slug !== existing.slug) {
      const existingSlug = await categoryQueries.getCategoryBySlug(validated.slug)
      if (existingSlug) throw new ValidationError('Slug sudah digunakan')
    }

    if (validated.name && validated.name !== existing.name) {
      const existingName = await categoryQueries.getCategoryByName(validated.name)
      if (existingName) throw new ValidationError('Nama kategori sudah digunakan')
    }

    return prisma.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id: validated.id },
        data: {
          name: validated.name !== undefined ? validated.name : undefined,
          slug: validated.slug !== undefined ? validated.slug : undefined,
          description: validated.description !== undefined ? validated.description : undefined,
          updatedBy: userId,
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Category',
          entityId: updatedCategory.id,
          userId,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify(updatedCategory)
        }
      })

      return updatedCategory
    })
  },

  async deleteCategory(id: string, userId: string) {
    await requireCmsUpdate(userId)

    const existing = await categoryQueries.getCategoryById(id)
    if (!existing) throw new NotFoundError('Kategori tidak ditemukan')

    // Cek apakah kategori sedang digunakan
    const postCount = await prisma.post.count({ where: { categoryId: id, deletedAt: null } })
    if (postCount > 0) throw new ValidationError('Kategori sedang digunakan pada artikel, tidak dapat dihapus')

    return prisma.$transaction(async (tx) => {
      const deletedCategory = await tx.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: userId,
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Category',
          entityId: deletedCategory.id,
          userId,
          oldData: JSON.stringify(existing)
        }
      })

      return deletedCategory
    })
  }
}
