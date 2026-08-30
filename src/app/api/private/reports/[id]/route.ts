import { NextResponse } from 'next/server'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { AppError } from '@/core/errors/custom-errors'
import { storageService } from '@/core/storage/storage-service'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('lpj.view')
    if (!isOrganizationAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    if (!id || id.length > 150) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    const report = await prisma.report.findFirst({
      where: { id, deletedAt: null },
      select: { documentPublicId: true },
    })
    if (!report?.documentPublicId) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    const response = NextResponse.redirect(storageService.getPrivateDocumentUrl(report.documentPublicId))
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500
    const safeStatus = status === 401 ? 401 : status === 403 ? 403 : 500
    return NextResponse.json({ error: safeStatus === 401 ? 'Unauthorized' : safeStatus === 403 ? 'Forbidden' : 'File belum dapat dibuka' }, { status: safeStatus })
  }
}
