'use server'

import { auth } from '@/core/auth/auth'
import { userService } from './services'
import { userCreateSchema, UserCreateInput, userUpdateSchema, UserUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createUserAction(data: UserCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }
    // TODO: Add RBAC check here e.g. can('user.create', session.user)

    const parsed = userCreateSchema.parse(data)
    await userService.createUser(parsed, session.user.id)
    
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updateUserAction(data: UserUpdateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }
    // TODO: Add RBAC check here

    const parsed = userUpdateSchema.parse(data)
    await userService.updateUser(parsed, session.user.id)
    
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    await userService.deleteUser(userId, session.user.id)
    
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}
