'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/core/auth/auth'
import { contentPlanService } from './services'
import { ContentPlanStatus } from '@prisma/client'

function value(formData: FormData, key: string) {
  const field = formData.get(key)
  return typeof field === 'string' ? field : ''
}

export async function createContentPlanAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await contentPlanService.createPlan({
      title: value(formData, 'title'),
      platform: value(formData, 'platform'),
      publishDate: new Date(value(formData, 'publishDate')),
      status: value(formData, 'status') as ContentPlanStatus,
      authorId: value(formData, 'authorId') || session.user.id,
    }, session.user.id)

    revalidatePath('/admin/cms/content-plan')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updateContentPlanStatusAction(id: string, status: ContentPlanStatus) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    if (status === ContentPlanStatus.PUBLISHED) {
      await contentPlanService.publishPlan(id, session.user.id)
    } else {
      await contentPlanService.updatePlan({ id, status }, session.user.id)
    }

    revalidatePath('/admin/cms/content-plan')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
