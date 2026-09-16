import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { webConfigQueries } from '@/features/web-config/queries'
import { AboutContentForm } from './about-content-form'

export const metadata = { title: 'Konten Tentang' }

export default async function OrganizationAboutPage() {
  const actor = await requireAuth()
  await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
  const initialContent = await webConfigQueries.getPublicAboutContent()

  return <div className="space-y-6"><div><h1 className="font-heading text-2xl font-extrabold text-primary">Konten Tentang</h1><p className="mt-1 text-sm text-muted">Kelola narasi Sejarah yang tampil di halaman Tentang publik.</p></div><AboutContentForm initialContent={initialContent} /></div>
}
