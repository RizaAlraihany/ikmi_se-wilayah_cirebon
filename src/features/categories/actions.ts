'use server'

import { requirePermission } from '@/core/authorization/guards'
import { categoryService } from './services'
import { CategoryCreateInput, CategoryUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function createCategoryAction(data: CategoryCreateInput) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:category:create:${actor.id}`, 30, 3600)

    await categoryService.createCategory(data, actor.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/publikasi')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Kategori belum dapat dibuat.', 'category.create') }
  }
}

export async function updateCategoryAction(data: CategoryUpdateInput) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:category:update:${actor.id}`, 60, 3600)

    await categoryService.updateCategory(data, actor.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/publikasi')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Kategori belum dapat diperbarui.', 'category.update') }
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:category:delete:${actor.id}`, 30, 3600)

    await categoryService.deleteCategory(id, actor.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/publikasi')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Kategori belum dapat dihapus.', 'category.delete') }
  }
}
