'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReportAction, uploadReportDocumentAction } from '@/features/reports/actions'
import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Plus, X } from 'lucide-react'

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export function LpjForm({ events }: { events: { id: string; title: string }[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(event.currentTarget)
    const eventId = getFormString(formData, 'eventId')
    const file = formData.get('documentFile')

    if (!eventId || !(file instanceof File) || file.size === 0) {
      setError('Event dan dokumen LPJ wajib diisi.')
      setLoading(false)
      return
    }

    const uploadData = new FormData()
    uploadData.append('file', file)
    const upload = await uploadReportDocumentAction(uploadData)

    if (upload.error || !upload.url) {
      setError(upload.error || 'Upload dokumen gagal.')
      setLoading(false)
      return
    }

    const selectedEvent = events.find((e) => e.id === eventId)
    const eventTitle = selectedEvent?.title || 'LPJ Event'

    const result = await submitReportAction({
      title: `LPJ: ${eventTitle}`,
      eventId,
      documentUrl: upload.url,
      documentPublicId: upload.publicId,
    })

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess('Berhasil mengirim LPJ.')
      setIsOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const formContent = (
    <div className="space-y-4">
      <div className="mb-2">
        <CardTitle className="text-xl">Upload LPJ Baru</CardTitle>
        <CardDescription>Unggah tautan dokumen laporan untuk event yang belum memiliki LPJ.</CardDescription>
      </div>

      {error && (
        <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-success/20 px-4 py-3 text-sm font-medium text-primary ring-1 ring-success/40">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="eventId" className="text-sm font-semibold text-primary">Pilih Event</label>
          <ListboxSelect
            id="eventId"
            name="eventId"
            defaultValue=""
            disabled={loading}
            options={[
              { value: '', label: 'Pilih event' },
              ...events.map((eventItem) => ({ value: eventItem.id, label: eventItem.title })),
            ]}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="documentFile" className="text-sm font-semibold text-primary">Dokumen PDF</label>
          <Input
            type="file"
            id="documentFile"
            name="documentFile"
            accept="application/pdf"
            required
            disabled={loading}
          />
          <p className="text-xs text-muted">File akan diupload ke Cloudinary. Format PDF, maksimum 10MB.</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Submit LPJ'}
        </Button>
      </form>
    </div>
  )

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40 p-0 flex items-center justify-center md:bottom-10 md:right-10"
        title="Upload LPJ Baru"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-3xl bg-surface p-6 shadow-2xl sm:max-w-md sm:rounded-2xl pb-10 sm:pb-6">
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full bg-surface-alt p-2 text-muted transition-colors hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            {formContent}
          </div>
        </div>
      )}
    </>
  )
}
