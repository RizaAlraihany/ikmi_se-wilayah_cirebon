import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { categoryQueries } from '@/features/categories/queries'
import { BloggerImportBoard } from './blogger-import-board'

export default async function ImportBloggerPostsPage() {
  const categories = await categoryQueries.getPublicationCategories()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href="/admin/cms/posts"
          className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Kembali ke publikasi"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Migrasi arsip</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-primary">Import dari Blogger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Tinjau postingan lama sebelum menyimpannya sebagai publikasi IKMI. Postingan yang sudah pernah diimpor akan ditandai agar tidak dibuat dua kali.
          </p>
        </div>
      </div>

      <BloggerImportBoard categories={categories} />
    </div>
  )
}
