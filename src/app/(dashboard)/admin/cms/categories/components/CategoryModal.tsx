'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [name, setName] = useState(category?.name || '')
  const [slug, setSlug] = useState(category?.slug || '')
  const [description, setDescription] = useState(category?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!category) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = { name, slug, description }
    
    let result
    if (category) {
      result = await updateCategoryAction({ ...payload, id: category.id })
    } else {
      result = await createCategoryAction(payload)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
      router.refresh()
    }
  }

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
            <label className="text-sm font-semibold text-primary">Nama Kategori</label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Berita"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="contoh-slug"
              required
            />
            <p className="text-xs text-text-secondary">Hanya huruf kecil, angka, dan strip (-).</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">Deskripsi</label>
            <Textarea
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
