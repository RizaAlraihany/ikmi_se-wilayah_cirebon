'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  createDocumentArchiveAction,
  uploadDocumentArchiveAction,
} from '@/features/document-archives/actions'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Textarea } from '@/components/ui/textarea'

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export function DocumentArchiveForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      setError('Dokumen wajib dipilih.')
      setIsSubmitting(false)
      return
    }

    const uploadData = new FormData()
    uploadData.append('file', file)
    const upload = await uploadDocumentArchiveAction(uploadData)

    if (upload.error || !upload.url) {
      setError(upload.error || 'Upload dokumen gagal.')
      setIsSubmitting(false)
      return
    }

    const result = await createDocumentArchiveAction({
      title: getFormString(formData, 'title'),
      category: getFormString(formData, 'category'),
      description: getFormString(formData, 'description') || undefined,
      archivedAt: getFormString(formData, 'archivedAt'),
      fileUrl: upload.url,
      filePublicId: upload.publicId,
    })

    if (result?.error) {
      setError(result.error)
    } else {
      setIsOpen(false)
    }

    setIsSubmitting(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Tambah Dokumen
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="document-modal-title">
          <Card className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t-4 border-t-accent shadow-float sm:rounded-2xl">
            <form action={handleSubmit}>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="document-modal-title" className="font-heading text-xl font-bold text-primary">
                      Arsip Dokumen Baru
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Simpan dokumen internal sekretaris sebagai arsip PDF.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Tutup modal">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>

                {error ? (
                  <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="title" className="text-sm font-semibold text-primary">Judul Dokumen</label>
                    <Input id="title" name="title" required disabled={isSubmitting} className="rounded-2xl" placeholder="Contoh: Arsip Notulen Rapat" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-semibold text-primary">Kategori</label>
                    <ListboxSelect
                      id="category"
                      name="category"
                      defaultValue={documentArchiveCategories[0]}
                      options={documentArchiveCategories.map((category) => ({ value: category, label: category }))}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="archivedAt" className="text-sm font-semibold text-primary">Tanggal Arsip</label>
                    <Input
                      id="archivedAt"
                      name="archivedAt"
                      type="text"
                      inputMode="numeric"
                      required
                      disabled={isSubmitting}
                      className="rounded-2xl"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="description" className="text-sm font-semibold text-primary">Deskripsi</label>
                    <Textarea id="description" name="description" disabled={isSubmitting} className="rounded-2xl" placeholder="Keterangan singkat dokumen..." rows={4} />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="file" className="text-sm font-semibold text-primary">Dokumen PDF</label>
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      accept="application/pdf"
                      required
                      disabled={isSubmitting}
                      className="rounded-2xl"
                    />
                    <p className="text-xs text-text-secondary">Maksimal 10MB. File akan disimpan ke Cloudinary.</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Dokumen'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      ) : null}
    </>
  )
}
