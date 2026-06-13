'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReportAction, uploadReportDocumentAction } from '@/features/reports/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export function LpjForm({ events }: { events: { id: string; title: string }[] }) {
  const router = useRouter()
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
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload LPJ Baru</CardTitle>
        <CardDescription>Unggah tautan dokumen laporan untuk event yang belum memiliki LPJ.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl bg-success/20 px-4 py-3 text-sm font-medium text-primary ring-1 ring-success/40">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="eventId" className="text-sm font-semibold text-primary">Pilih Event</label>
            <Select id="eventId" name="eventId" disabled={loading}>
              <option value="">Pilih event</option>
              {events.map((eventItem) => (
                <option key={eventItem.id} value={eventItem.id}>{eventItem.title}</option>
              ))}
            </Select>
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
      </CardContent>
    </Card>
  )
}
