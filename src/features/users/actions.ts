'use server'

import { requireSuperAdmin } from '@/core/authorization/guards'
import { userService } from './services'
import { userCreateSchema, UserCreateInput, userUpdateSchema, UserUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function createUserAction(data: UserCreateInput) {
  try {
    const actor = await requireSuperAdmin()
    const parsed = userCreateSchema.parse(data)
    await userService.createUser(parsed, actor.id)

    revalidatePath('/admin/users')
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengguna belum dapat dibuat.', 'user.create') }
  }
}

export async function updateUserAction(data: UserUpdateInput) {
  try {
    const actor = await requireSuperAdmin()
    const parsed = userUpdateSchema.parse(data)
    await userService.updateUser(parsed, actor.id)

    revalidatePath('/admin/users')
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengguna belum dapat diperbarui.', 'user.update') }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const actor = await requireSuperAdmin()
    await userService.deleteUser(userId, actor.id)

    revalidatePath('/admin/users')
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengguna belum dapat dihapus.', 'user.delete') }
  }
}
