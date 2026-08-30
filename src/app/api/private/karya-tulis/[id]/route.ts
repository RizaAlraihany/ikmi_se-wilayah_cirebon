import { NextResponse } from 'next/server'
import { isKomdigiAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { storageService } from '@/core/storage/storage-service'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('post.view')
    if (!isKomdigiAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const rawVersion = new URL(request.url).searchParams.get('version')
    const version = rawVersion && /^\d{1,4}$/.test(rawVersion) ? Number(rawVersion) : null
    const submission = await prisma.karyaTulis.findFirst({ where: { id, deletedAt: null }, select: { filePublicId: true, versions: { where: { versionNumber: version ?? -1 }, select: { filePublicId: true }, take: 1 } } })
    const publicId = version ? submission?.versions[0]?.filePublicId : submission?.filePublicId
    if (!publicId) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    const response = NextResponse.redirect(storageService.getPrivateDocumentUrl(publicId))
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
