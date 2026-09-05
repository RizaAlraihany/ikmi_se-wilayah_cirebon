'use client'

import type { PamfletRequestStatus } from '@prisma/client'
import { CalendarPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { convertPamfletRequestToContentPlanAction } from '@/features/content-plan/actions'
import { CONTENT_PLATFORMS, CONTENT_TYPES } from '@/features/content-plan/domain'

type CreateContentPlanDialogProps = {
  request: {
    id: string
    requestNumber: string
    activityName: string
    deadline: Date
    status: PamfletRequestStatus
    assigneeId: string | null
    hasAttachment: boolean
    contentPlan: { id: string } | null
  }
  assignees: { id: string; name: string }[]
}

const convertibleStatuses: PamfletRequestStatus[] = [
  'DITERIMA',
  'DIKERJAKAN',
  'SELESAI',
]

const deadlineFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Jakarta',
})

export function CreateContentPlanDialog({ request, assignees }: CreateContentPlanDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isConvertible = convertibleStatuses.includes(request.status) && !request.contentPlan

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await convertPamfletRequestToContentPlanAction(request.id, new FormData(event.currentTarget))
      if (!result.success) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.push(`/admin/cms/content-plan${result.month ? `?month=${result.month}` : ''}`)
      router.refresh()
    } catch (actionError) {
      console.error('Request Pamflet conversion failed.', actionError)
      setError('Content Plan belum dapat dibuat. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="min-h-11"
        disabled={!isConvertible}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        {request.contentPlan ? 'Content Plan sudah dibuat' : 'Buat Content Plan'}
      </Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) setOpen(nextOpen)
        }}
        title="Buat Content Plan"
        description="Tentukan jadwal publikasi, platform, jenis konten, dan PIC. Data sumber dibawa langsung dari Request."
      >
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-6">
          {error ? <Alert tone="danger" title="Content Plan belum dibuat">{error}</Alert> : null}

          <section className="border-y border-border py-4" aria-labelledby="conversion-source-title">
            <p id="conversion-source-title" className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">Request sumber</p>
            <h3 className="mt-2 break-words font-heading text-lg font-extrabold text-primary">{request.activityName}</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-text-muted">Nomor Request</dt><dd className="mt-0.5 break-all font-mono font-semibold text-primary">{request.requestNumber}</dd></div>
              <div><dt className="text-text-muted">Deadline Request</dt><dd className="mt-0.5 font-semibold text-danger">{deadlineFormatter.format(request.deadline)}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-text-secondary">
              Judul, relasi Program/Agenda, catatan, deadline, dan {request.hasAttachment ? 'lampiran privat' : 'informasi bahan'} akan dibawa otomatis.
            </p>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jadwal publikasi" htmlFor="conversion-publish-date" required className="sm:col-span-2">
              <Input id="conversion-publish-date" name="publishDate" type="datetime-local" required />
            </Field>
            <Field label="Platform" htmlFor="conversion-platform" required>
              <Select id="conversion-platform" name="platform" required defaultValue="Instagram">
                {CONTENT_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
              </Select>
            </Field>
            <Field label="Jenis konten" htmlFor="conversion-content-type" required>
              <Select id="conversion-content-type" name="contentType" required defaultValue="">
                <option value="" disabled>Pilih jenis</option>
                {CONTENT_TYPES.map((contentType) => <option key={contentType} value={contentType}>{contentType}</option>)}
              </Select>
            </Field>
            <Field label="PIC Content Plan" htmlFor="conversion-author" required className="sm:col-span-2">
              <Select id="conversion-author" name="authorId" required defaultValue={request.assigneeId ?? ''}>
                <option value="" disabled>Pilih Admin Komdigi</option>
                {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
              </Select>
            </Field>
          </div>

          {!assignees.length ? (
            <Alert tone="warning" title="Belum ada PIC aktif">Aktifkan akun Admin Komdigi sebelum membuat Content Plan.</Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !assignees.length}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
              {isSubmitting ? 'Membuat…' : 'Buat di Kalender'}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  )
}
