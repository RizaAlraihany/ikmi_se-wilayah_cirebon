import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { categoryQueries } from '@/features/categories/queries'
import { CategoryList } from './components/CategoryList'
import { requireCmsUpdate } from '@/features/cms/access'

export const metadata = {
  title: 'Kategori Artikel | IKMI Cirebon',
}

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await requireCmsUpdate(session.user.id)

  const categories = await categoryQueries.getAllCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-primary">Kategori Artikel</h1>
        <p className="mt-1 text-sm text-muted">Kelola struktur kategori untuk publikasi ruang gagasan dan berita.</p>
      </div>

      <CategoryList categories={categories} />
    </div>
  )
}
