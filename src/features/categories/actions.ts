'use server'

import { auth } from '@/core/auth/auth'
import { categoryService } from './services'
import { CategoryCreateInput, CategoryUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'

export async function createCategoryAction(data: CategoryCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:category:create:${session.user.id}`, 30, 3600)

    await categoryService.createCategory(data, session.user.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updateCategoryAction(data: CategoryUpdateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:category:update:${session.user.id}`, 60, 3600)

    await categoryService.updateCategory(data, session.user.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:category:delete:${session.user.id}`, 30, 3600)

    await categoryService.deleteCategory(id, session.user.id)
    revalidatePath('/admin/cms/categories')
    revalidatePath('/admin/cms/posts')
    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
