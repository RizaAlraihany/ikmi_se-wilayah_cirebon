import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { webConfigQueries } from '@/features/web-config/queries'
import { AboutContentForm } from './about-content-form'

export const metadata = { title: 'Konten Tentang' }

export default async function OrganizationAboutPage() {
  const actor = await requireAuth()
  await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
  const initialContent = await webConfigQueries.getPublicAboutContent()

  return (
    <div className="space-y-6">
      <div className="border-y-2 border-primary bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase text-accent">Website Publik</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Konten Tentang</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-text-secondary">Kelola narasi sejarah yang tampil pada halaman Tentang publik. Informasi kabinet dan struktur tetap dikelola dari menu Organisasi.</p>
      </div>
      <AboutContentForm initialContent={initialContent} />
    </div>
  )
}
