import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { KOMDIGI_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { webConfigQueries } from '@/features/web-config/queries'
import { KomdigiPageHeader } from '../../_components/komdigi-page-header'
import { HomepageEditorialForm } from '../homepage-editorial-form'

export const metadata = { title: 'Konten Beranda' }

export default async function HomepageEditorialPage() {
  const actor = await requireAuth()
  await requireRoleForUser(actor, KOMDIGI_DASHBOARD_ROLE_IDS)
  const initialContent = await webConfigQueries.getPublicHomepageContent()

  return <div className="space-y-7"><KomdigiPageHeader title="Konten Beranda" description="Kelola copy editorial Beranda tanpa mengubah data Agenda, Struktur, Publikasi, atau banner program." /><HomepageEditorialForm initialContent={initialContent} /></div>
}
