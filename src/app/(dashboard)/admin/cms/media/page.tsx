import { Search } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { mediaQueries } from '@/features/media/queries'
import { requireCmsUpdate } from '@/features/cms/access'
import { MediaLibraryClient } from './MediaLibraryClient'

export const metadata = {
  title: 'Media Library | IKMI Cirebon',
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await requireCmsUpdate(session.user.id)

  const params = await searchParams
  const q = params.q || ''
  const assets = await mediaQueries.getMediaAssets(q)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Media Library</h1>
          <p className="mt-1 text-sm text-muted">Upload, preview, cari, salin URL, dan hapus media Cloudinary CMS.</p>
        </div>
        <form className="relative w-full sm:max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input name="q" defaultValue={q} placeholder="Cari file atau mime type..." className="pl-11" aria-label="Cari media" />
        </form>
      </div>

      <MediaLibraryClient assets={assets} />
    </div>
  )
}
