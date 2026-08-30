'use server'

import { revalidatePath } from 'next/cache'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateDocumentSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { createDocumentArchiveSchema } from './schemas'
import { documentArchiveService, validateDocumentArchiveRelations } from './services'

function actionErrorMessage(error: unknown) {
  if (error instanceof ValidationError || error instanceof ForbiddenError || error instanceof NotFoundError) return error.message
  return 'Arsip dokumen tidak dapat diproses. Silakan coba kembali.'
}

async function requireDocumentManager() {
  const user = await requirePermission('document_archive.manage')
  if (!isOrganizationAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
    throw new ForbiddenError('Arsip dokumen hanya dapat dikelola oleh Admin Organisasi.')
  }
  return user
}

export async function createDocumentArchiveAction(formData: FormData) {
  let uploaded: { publicId: string; secureUrl: string } | null = null
  try {
    const user = await requireDocumentManager()
    await rateLimit(`document-archive:create:${user.id}`, 30, 3600)
    const parsed = createDocumentArchiveSchema.safeParse({
      title: formData.get('title'), category: formData.get('category'), description: formData.get('description'),
      archivedAt: formData.get('archivedAt'), organizationalUnitId: formData.get('organizationalUnitId'),
      periodId: formData.get('periodId'), programId: formData.get('programId'), visibility: formData.get('visibility') || 'INTERNAL',
    })
    if (!parsed.success) return { success: false, message: 'Data arsip dokumen tidak valid.' }
    await validateDocumentArchiveRelations(parsed.data)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) return { success: false, message: 'Dokumen PDF atau DOCX wajib dipilih.' }
    const validation = await validateDocumentSignature(file)
    if (!validation.valid) return { success: false, message: validation.error ?? 'Dokumen tidak valid.' }

    uploaded = await storageService.uploadPrivateDocument(file, cloudinaryFolders.documents)
    await documentArchiveService.createDocument(parsed.data, {
      fileUrl: uploaded.secureUrl,
      filePublicId: uploaded.publicId,
      fileName: file.name,
      fileMimeType: file.type,
      fileSize: file.size,
    }, user)
    revalidatePath('/admin/documents')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    if (uploaded) await storageService.deleteFile(uploaded.publicId, 'raw', 'authenticated').catch(() => undefined)
    return { success: false, message: actionErrorMessage(error) }
  }
}

export async function deleteDocumentArchiveAction(id: string) {
  try {
    const user = await requireDocumentManager()
    await rateLimit(`document-archive:archive:${user.id}`, 60, 3600)
    await documentArchiveService.archiveDocument(id, user)
    revalidatePath('/admin/documents')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, message: actionErrorMessage(error) }
  }
}
