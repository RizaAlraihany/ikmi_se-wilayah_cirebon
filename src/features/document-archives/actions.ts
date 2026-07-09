'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/core/auth/auth'
import { can, type SessionUser } from '@/core/authorization/rbac'
import { validateDocument } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { createDocumentArchiveSchema } from './schemas'
import { documentArchiveService } from './services'

function toSessionUser(user: { id?: string | null; roleId?: string | null; departmentId?: string | null; positionId?: string | null }): SessionUser | null {
  if (!user.id || !user.roleId) return null

  return {
    id: user.id,
    roleId: user.roleId,
    departmentId: user.departmentId ?? null,
    positionId: user.positionId ?? null,
  }
}

export async function createDocumentArchiveAction(data: unknown) {
  try {
    const session = await auth()
    const sessionUser = session?.user ? toSessionUser(session.user) : null
    if (!sessionUser || !(await can('letter.create', sessionUser))) {
      return { error: 'Akses ditolak.' }
    }

    const parsed = createDocumentArchiveSchema.parse(data)
    await documentArchiveService.createDocument(parsed, sessionUser)

    revalidatePath('/admin/documents')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat membuat arsip dokumen' }
  }
}

export async function uploadDocumentArchiveAction(formData: FormData) {
  try {
    const session = await auth()
    const sessionUser = session?.user ? toSessionUser(session.user) : null
    if (!sessionUser || !(await can('letter.create', sessionUser))) {
      return { error: 'Akses ditolak.' }
    }

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'Dokumen wajib dipilih.' }
    }

    const validation = validateDocument(file)
    if (!validation.valid) return { error: validation.error || 'File tidak valid.' }

    const uploaded = await storageService.uploadDocument(file, cloudinaryFolders.documents)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat upload dokumen' }
  }
}

export async function deleteDocumentArchiveAction(id: string) {
  try {
    const session = await auth()
    const sessionUser = session?.user ? toSessionUser(session.user) : null
    if (!sessionUser || !(await can('letter.delete', sessionUser))) {
      return { error: 'Akses ditolak.' }
    }

    await documentArchiveService.deleteDocument(id, sessionUser)
    revalidatePath('/admin/documents')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat menghapus arsip dokumen' }
  }
}
