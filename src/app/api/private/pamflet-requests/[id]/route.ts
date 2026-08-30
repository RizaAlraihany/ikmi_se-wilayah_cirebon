import { NextResponse } from 'next/server'
import { isKomdigiAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { AppError } from '@/core/errors/custom-errors'
import { ALLOWED_IMAGE_TYPES } from '@/core/storage/file-validator'
import { storageService } from '@/core/storage/storage-service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('content_plan.view')
    if (!isKomdigiAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    if (!id || id.length > 150) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    const request = await prisma.pamfletRequest.findFirst({
      where: { id, deletedAt: null },
      select: { attachmentPublicId: true, attachmentMimeType: true },
    })
    if (!request?.attachmentPublicId) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    const resourceType = request.attachmentMimeType && ALLOWED_IMAGE_TYPES.includes(request.attachmentMimeType)
      ? 'image'
      : 'raw'
    const response = NextResponse.redirect(
      storageService.getPrivateFileUrl(request.attachmentPublicId, resourceType),
    )
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return response
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.statusCode === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: error.statusCode === 401 ? 401 : 403 },
      )
    }
    return NextResponse.json({ error: 'File belum dapat dibuka' }, { status: 500 })
  }
}
