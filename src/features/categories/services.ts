import { prisma } from '@/core/database/prisma'
import { CategoryCreateInput, CategoryUpdateInput, PUBLICATION_CATEGORY_SLUGS, PUBLICATION_CATEGORY_NAMES, categoryCreateSchema, categoryUpdateSchema } from './schemas'
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

    const expectedName = PUBLICATION_CATEGORY_NAMES[validated.slug as (typeof PUBLICATION_CATEGORY_SLUGS)[number]]
    if (validated.name !== expectedName) {
      throw new ValidationError(`Nama kategori untuk slug "${validated.slug}" harus "${expectedName}"`)
    }

    return prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: expectedName,
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
    if (!PUBLICATION_CATEGORY_SLUGS.includes(existing.slug as (typeof PUBLICATION_CATEGORY_SLUGS)[number])) {
      throw new ValidationError('Kategori historis tidak dapat diubah dari UI publikasi aktif.')
    }

    if (validated.description !== undefined) {
      if (validated.description.trim().length < 5) {
        throw new ValidationError('Deskripsi minimal 5 karakter')
      }
    }

    return prisma.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id: validated.id },
        data: {
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
    if (PUBLICATION_CATEGORY_SLUGS.includes(existing.slug as (typeof PUBLICATION_CATEGORY_SLUGS)[number])) {
      throw new ValidationError('Kategori publikasi utama tidak dapat dihapus.')
    }

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
