'use client'

import { ContentPlanStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createContentPlanAction, updateContentPlanAction, updateContentPlanStatusAction } from '@/features/content-plan/actions'
import {
  CONTENT_PLATFORMS,
  CONTENT_PLAN_STATUSES,
  CONTENT_TYPES,
  contentPlanStatusLabel,
  formatJakartaContentDatetime,
} from '@/features/content-plan/domain'

export type ContentPlanFormData = {
  id: string
  title: string
  platform: string
  publishDate: Date
  status: ContentPlanStatus
  authorId: string
  contentType: string | null
  programId: string | null
  agendaId: string | null
  pamfletRequestId: string | null
  pamfletRequest?: { requestNumber: string; deadline: Date } | null
  notes: string | null
  assetUrl: string | null
  publishedUrl: string | null
}

interface Props {
  authors: { id: string; name: string }[]
  programs: { id: string; name: string }[]
  agendas: { id: string; name: string }[]
  defaultDate?: Date
  initialData?: ContentPlanFormData
  onSuccess?: () => void
}

export function ContentPlanForm({ authors, programs, agendas, defaultDate, initialData, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [status, setStatus] = useState<ContentPlanStatus>(initialData?.status || ContentPlanStatus.PLANNED)
  const dateToUse = initialData?.publishDate || defaultDate
  const canPublish = initialData?.status === 'READY' || initialData?.status === 'SCHEDULED' || initialData?.status === 'PUBLISHED'

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = initialData
      ? await updateContentPlanAction(initialData.id, formData)
      : await createContentPlanAction(formData)
    if (result.success) {
      onSuccess?.()
      router.refresh()
      return
    }
    setError(result.error || 'Content Plan belum dapat disimpan.')
    setLoading(false)
  }

  async function cancelPlan() {
    if (!initialData) return
    setError(null)
    setLoading(true)
    const result = await updateContentPlanStatusAction(initialData.id, ContentPlanStatus.CANCELLED)
    if (result.success) {
      setCancelOpen(false)
      onSuccess?.()
      router.refresh()
      return
    }
    setCancelOpen(false)
    setError(result.error || 'Content Plan belum dapat dibatalkan.')
    setLoading(false)
  }

  const statusOptions = CONTENT_PLAN_STATUSES.filter((item) => {
    if (initialData?.status === 'PUBLISHED') return item === 'PUBLISHED'
    if (item === 'PUBLISHED') return canPublish
    return true
  })

  return (
    <>
      <form onSubmit={submit} aria-busy={loading} className="space-y-6">
        {error ? <Alert tone="danger" title="Perubahan belum tersimpan">{error}</Alert> : null}

        {initialData?.pamfletRequestId ? (
          <Alert tone="info" title={`Berasal dari ${initialData.pamfletRequest?.requestNumber ?? 'Request Pamflet'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {initialData.pamfletRequest?.deadline
                  ? `Deadline Request ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(initialData.pamfletRequest.deadline)}.`
                  : 'Data sumber tetap terhubung ke Content Plan ini.'}
              </span>
              <ButtonLink href={`/admin/request-pamflet/${initialData.pamfletRequestId}`} variant="secondary" size="sm" className="shrink-0">
                Buka Request Asli
              </ButtonLink>
            </div>
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Judul konten" htmlFor="plan-title" required className="sm:col-span-2">
            <Input id="plan-title" name="title" required minLength={3} maxLength={180} defaultValue={initialData?.title} placeholder="Contoh: Carousel Agenda Sapa Rasa" />
          </Field>
          <Field label="Platform" htmlFor="plan-platform" required>
            <Select id="plan-platform" name="platform" required defaultValue={initialData?.platform || 'Instagram'}>
              {CONTENT_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </Select>
          </Field>
          <Field label="Jenis konten" htmlFor="plan-type" required>
            <Select id="plan-type" name="contentType" required defaultValue={initialData?.contentType || ''}>
              <option value="" disabled>Pilih jenis</option>
              {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </Field>
          <Field label="Jadwal publikasi" htmlFor="plan-date" required>
            <Input id="plan-date" name="publishDate" type="datetime-local" required defaultValue={formatJakartaContentDatetime(dateToUse)} />
          </Field>
          <Field label="PIC" htmlFor="plan-author" required>
            <Select id="plan-author" name="authorId" required defaultValue={initialData?.authorId || authors[0]?.id || ''}>
              <option value="" disabled>Pilih PIC</option>
              {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
            </Select>
          </Field>
        </div>

        <details className="group border-y border-border py-4" open={Boolean(initialData)}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-heading text-sm font-extrabold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Detail, relasi, dan aset
            <span className="text-xs font-semibold text-text-muted group-open:hidden">Buka</span>
            <span className="hidden text-xs font-semibold text-text-muted group-open:inline">Tutup</span>
          </summary>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Program terkait" htmlFor="plan-program">
              <Select id="plan-program" name="programId" defaultValue={initialData?.programId || ''}>
                <option value="">Tanpa Program</option>
                {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
              </Select>
            </Field>
            <Field label="Agenda terkait" htmlFor="plan-agenda">
              <Select id="plan-agenda" name="agendaId" defaultValue={initialData?.agendaId || ''}>
                <option value="">Tanpa Agenda</option>
                {agendas.map((agenda) => <option key={agenda.id} value={agenda.id}>{agenda.name}</option>)}
              </Select>
            </Field>
            <Field label="URL aset" htmlFor="plan-asset" description="Path internal atau URL HTTPS menuju materi kerja." className="sm:col-span-2">
              <Input id="plan-asset" name="assetUrl" type="text" inputMode="url" maxLength={2048} defaultValue={initialData?.assetUrl || ''} placeholder="https://..." />
            </Field>
            <Field label="Catatan" htmlFor="plan-notes" className="sm:col-span-2">
              <Textarea id="plan-notes" name="notes" maxLength={5000} defaultValue={initialData?.notes || ''} />
            </Field>
          </div>
        </details>

        {initialData ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Status" htmlFor="plan-status" required>
              <Select id="plan-status" name="status" required value={status} onChange={(event) => setStatus(event.target.value as ContentPlanStatus)}>
                {statusOptions.map((item) => <option key={item} value={item}>{contentPlanStatusLabel(item)}</option>)}
              </Select>
            </Field>
            <Field label="URL publikasi" htmlFor="plan-published-url" required={status === 'PUBLISHED'} description="Wajib ketika status Dipublikasikan.">
              <Input id="plan-published-url" name="publishedUrl" type="text" inputMode="url" maxLength={2048} required={status === 'PUBLISHED'} defaultValue={initialData.publishedUrl || ''} placeholder="https://..." />
            </Field>
          </div>
        ) : <input type="hidden" name="status" value={ContentPlanStatus.PLANNED} />}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>{initialData && !['PUBLISHED', 'CANCELLED'].includes(initialData.status) ? <Button type="button" variant="danger" onClick={() => setCancelOpen(true)} disabled={loading}>Batalkan Konten</Button> : null}</div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {onSuccess ? <Button type="button" variant="secondary" onClick={onSuccess} disabled={loading}>Tutup</Button> : null}
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan…' : initialData ? 'Simpan Perubahan' : 'Tambah Konten'}</Button>
          </div>
        </div>
      </form>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen} title="Batalkan rencana konten?" description="Rencana tetap tersimpan sebagai riwayat dengan status Dibatalkan.">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)} disabled={loading}>Kembali</Button>
          <Button type="button" variant="danger" onClick={cancelPlan} disabled={loading}>{loading ? 'Membatalkan…' : 'Ya, batalkan'}</Button>
        </div>
      </Dialog>
    </>
  )
}
