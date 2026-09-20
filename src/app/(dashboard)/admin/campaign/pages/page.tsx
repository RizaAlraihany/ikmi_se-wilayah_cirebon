import type { Metadata } from 'next'
import { requirePermission } from '@/core/authorization/guards'
import { requireCmsView } from '@/features/cms/access'
import { webConfigQueries } from '@/features/web-config/queries'
import { PageHeroesForm } from './page-heroes-form'

export const metadata: Metadata = {
  title: 'Hero Halaman | CMS Beranda',
}

export default async function PageHeroesPage() {
  const actor = await requirePermission('cms.view')
  await requireCmsView(actor.id)
  const initialContent = await webConfigQueries.getPublicPageHeroes()

  return (
    <div className="space-y-6">
      <div className="border-y-2 border-primary bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase text-accent">CMS Beranda</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Hero Halaman Publik</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-pretty text-text-secondary">
          Kelola gambar, judul, dan deskripsi hero halaman publik.
        </p>
      </div>
      <PageHeroesForm initialContent={initialContent} />
    </div>
  )
}
