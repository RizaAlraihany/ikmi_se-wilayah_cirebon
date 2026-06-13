'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createLetterAction, uploadLetterDocumentAction } from '@/features/letters/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export function LetterForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      setError('Dokumen surat wajib dipilih.')
      setIsSubmitting(false)
      return
    }

    const uploadData = new FormData()
    uploadData.append('file', file)
    const upload = await uploadLetterDocumentAction(uploadData)

    if (upload.error || !upload.url) {
      setError(upload.error || 'Upload dokumen gagal.')
      setIsSubmitting(false)
      return
    }

    const result = await createLetterAction({
      type: getFormString(formData, 'type'),
      subject: getFormString(formData, 'subject'),
      fileUrl: upload.url,
      filePublicId: upload.publicId,
      date: getFormString(formData, 'date'),
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
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Surat
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="letter-modal-title">
          <Card className="w-full max-w-lg rounded-t-2xl border-t-4 border-t-accent sm:rounded-2xl">
            <form action={handleSubmit}>
              <CardContent className="space-y-5 p-6">
                <div>
                  <h2 id="letter-modal-title" className="font-heading text-xl font-bold text-primary">
                    Arsip Surat Baru
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">Tambahkan tautan dokumen surat untuk arsip internal.</p>
                </div>

                {error && (
                  <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-semibold text-primary">Tipe Surat</label>
                  <Select id="type" name="type" required disabled={isSubmitting}>
                    <option value="IN">Surat Masuk</option>
                    <option value="OUT">Surat Keluar</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-semibold text-primary">Perihal</label>
                  <Input id="subject" name="subject" required disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-semibold text-primary">Tanggal Surat</label>
                  <Input id="date" name="date" type="date" required disabled={isSubmitting} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-semibold text-primary">Dokumen PDF</label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="application/pdf"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-text-secondary">File akan diupload ke Cloudinary dan disimpan sebagai URL.</p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Surat'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
