import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from './post-form'
import { Card, CardContent } from '@/components/ui/card'
import { categoryQueries } from '@/features/categories/queries'

export default async function AdminCreatePostPage() {
  const categories = await categoryQueries.getAllCategories()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/cms/posts" className="rounded-full p-2 text-primary hover:bg-primary/5" aria-label="Kembali ke daftar artikel">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Tulis Artikel Baru</h1>
          <p className="mt-1 text-sm text-muted">Gunakan editor untuk membuat publikasi yang rapi dan siap direview.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <PostForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
        </CardContent>
      </Card>
    </div>
  )
}
