'use server'

import { auth } from '@/core/auth/auth'
import { blogService } from './services'
import { postCreateSchema, PostCreateInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createPostAction(data: PostCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.departmentId) {
      return { error: 'Anda harus memiliki departemen untuk membuat artikel.' }
    }

    const parsed = postCreateSchema.parse(data)
    await blogService.createPost(parsed, session.user.id, session.user.departmentId)
    
    revalidatePath('/dashboard/blog')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}
