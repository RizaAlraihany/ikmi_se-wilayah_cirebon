'use server'

import { letterService } from './services'
import { createLetterSchema } from './schemas'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import { revalidatePath } from 'next/cache'

export async function createLetterAction(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user || !(await can('letter.create', { id: session.user.id!, roleId: (session.user as { roleId: string }).roleId, departmentId: session.user.departmentId!, positionId: null }))) {
      return { error: 'Akses ditolak.' }
    }

    const sessionUser = { id: session.user.id!, roleId: (session.user as { roleId: string }).roleId, departmentId: session.user.departmentId! , positionId: null }

    const parsed = createLetterSchema.parse(data)
    await letterService.createLetter(parsed, sessionUser)

    revalidatePath('/admin/letters')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat membuat surat' }
  }
}

export async function deleteLetterAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user || !(await can('letter.delete', { id: session.user.id!, roleId: (session.user as { roleId: string }).roleId, departmentId: session.user.departmentId! , positionId: null }))) {
      return { error: 'Akses ditolak.' }
    }

    const sessionUser = { id: session.user.id!, roleId: (session.user as { roleId: string }).roleId, departmentId: session.user.departmentId! , positionId: null }

    await letterService.deleteLetter(id, sessionUser)
    revalidatePath('/admin/letters')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat menghapus surat' }
  }
}
