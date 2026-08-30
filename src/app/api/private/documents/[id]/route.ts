import { NextResponse } from 'next/server'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { AppError } from '@/core/errors/custom-errors'
import { storageService } from '@/core/storage/storage-service'
import { documentArchiveService } from '@/features/document-archives/services'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('document_archive.view')
    if (!isOrganizationAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    const file = await documentArchiveService.authorizeDownload(id, user)
    const response = NextResponse.redirect(storageService.getPrivateDocumentUrl(file.publicId))
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500
    const message = status === 404 ? 'File tidak ditemukan' : status === 403 ? 'Forbidden' : status === 401 ? 'Unauthorized' : 'File tidak dapat dibuka'
    return NextResponse.json({ error: message }, { status })
  }
}
