'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PUBLICATION_CATEGORY_SLUGS, PUBLICATION_CATEGORY_NAMES, categoryCreateSchema } from '@/features/categories/schemas'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createCategoryAction, updateCategoryAction } from '@/features/categories/actions'

type CategoryModalValue = {
  id: string
  name: string
  slug: string
  description: string
}

export function CategoryModal({ category, onClose }: { category: CategoryModalValue | null; onClose: () => void }) {
  const router = useRouter()
  const [slug, setSlug] = useState(category?.slug || '')
  const [description, setDescription] = useState(category?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const name = category ? PUBLICATION_CATEGORY_NAMES[category.slug as keyof typeof PUBLICATION_CATEGORY_NAMES] : ''
      const parsed = categoryCreateSchema.safeParse({ name, slug, description })
      if (!parsed.success) {
        setError(parsed.error.issues[0].message)
        return
      }
      const result = category
        ? await updateCategoryAction({ ...parsed.data, id: category.id })
        : await createCategoryAction(parsed.data)
      if (result.error) setError(result.error)
      else { onClose(); router.refresh() }
    } catch {
      setError('Kategori belum dapat disimpan. Periksa koneksi lalu coba kembali.')
    } finally {
      setLoading(false)
    }
  }

  const canonicalName = category ? PUBLICATION_CATEGORY_NAMES[category.slug as keyof typeof PUBLICATION_CATEGORY_NAMES] : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl border-t-4 border-t-accent bg-surface p-5 shadow-card ring-1 ring-border sm:rounded-2xl sm:p-6">
        <h3 className="mb-4 font-heading text-xl font-extrabold text-primary">
          {category ? 'Edit Kategori' : 'Tambah Kategori'}
        </h3>
        
        {error && (
          <div className="mb-4 rounded-xl bg-danger px-4 py-3 text-sm font-medium text-danger-foreground">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-sm font-semibold text-primary">Nama Kategori</label>
            {category ? (
              <Input
                id="category-name"
                value={canonicalName}
                readOnly
                className="bg-surface"
              />
            ) : (
              <Select
                id="category-name"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              >
                <option value="" disabled>Pilih kategori</option>
                {PUBLICATION_CATEGORY_SLUGS.map((value) => <option key={value} value={value}>{PUBLICATION_CATEGORY_NAMES[value]}</option>)}
              </Select>
            )}
          </div>
          {category && (
            <div className="space-y-2">
              <label htmlFor="category-slug" className="text-sm font-semibold text-primary">Slug</label>
              <Input
                id="category-slug"
                value={category.slug}
                readOnly
                className="bg-surface"
              />
              <p className="text-xs text-text-secondary">Slug tidak dapat diubah.</p>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="category-description" className="text-sm font-semibold text-primary">Deskripsi</label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
