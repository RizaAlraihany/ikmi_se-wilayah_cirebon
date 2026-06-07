'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReportAction } from '@/features/reports/actions'
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
    const documentUrl = getFormString(formData, 'documentUrl')

    if (!eventId || !documentUrl) {
      setError('Event dan URL Dokumen wajib diisi.')
      setLoading(false)
      return
    }

    const result = await submitReportAction({ eventId, documentUrl })

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
            <label htmlFor="documentUrl" className="text-sm font-semibold text-primary">URL Dokumen PDF</label>
            <Input
              type="url"
              id="documentUrl"
              name="documentUrl"
              placeholder="https://storage.example.com/lpj.pdf"
              disabled={loading}
            />
            <p className="text-xs text-muted">Format dokumen PDF, maksimum 10MB.</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Submit LPJ'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
