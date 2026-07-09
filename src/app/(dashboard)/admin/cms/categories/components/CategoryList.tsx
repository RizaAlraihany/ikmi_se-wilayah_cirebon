'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus } from 'lucide-react'
import { CategoryModal } from './CategoryModal'
import { deleteCategoryAction } from '@/features/categories/actions'
import { useRouter } from 'next/navigation'

type CategoryListItem = {
  id: string
  name: string
  slug: string
  description: string
  _count?: { posts: number }
}

export function CategoryList({ categories }: { categories: CategoryListItem[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    setError('')
    setIsDeleting(id)
    const result = await deleteCategoryAction(id)
    setIsDeleting(null)
    if (result.error) setError(result.error)
    else router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="m-4 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-primary" role="alert">
              {error}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-line text-muted">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Kategori</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Total Post</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-background">
                {filtered.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-surface/50">
                    <td className="px-6 py-4 font-medium text-primary">
                      {category.name}
                      <div className="text-xs text-muted font-normal mt-1">{category.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone="surface">{category.slug}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {category._count?.posts || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedCategory(category); setIsModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          disabled={isDeleting === category.id || (category._count?.posts || 0) > 0}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      Tidak ada data kategori ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
