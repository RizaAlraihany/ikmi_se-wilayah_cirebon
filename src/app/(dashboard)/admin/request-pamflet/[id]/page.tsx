import type { Metadata } from 'next'
import { PamfletRequestStatus, WhatsappMessageStatus } from '@prisma/client'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Download,
  FileText,
  Link as LinkIcon,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { contentPlanDateKey } from '@/features/content-plan/domain'
import {
  getPamfletRequestAssignees,
  getPamfletRequestById,
  getPamfletRequestHistory,
  getPamfletRequestNotificationDeliveries,
} from '@/features/request-pamflet/admin-actions'
import { PAMFLET_STATUS_LABELS, type PamfletWorkflowStatus } from '@/features/request-pamflet/domain'
import { AssignPamfletRequest } from './components/AssignPamfletRequest'
import { CreateContentPlanDialog } from './components/CreateContentPlanDialog'
import { NotificationRetryButton } from './components/NotificationRetryButton'
import { StatusUpdater } from './components/StatusUpdater'

export const metadata: Metadata = {
  title: 'Detail Request Pamflet - IKMI Cirebon',
}

const statusTone: Record<PamfletRequestStatus, 'surface' | 'warning' | 'accent' | 'success' | 'danger'> = {
  BARU: 'accent',
  DITERIMA: 'accent',
  DIKERJAKAN: 'warning',
  PERLU_REVISI: 'warning',
  SELESAI: 'success',
  DITOLAK: 'danger',
  DIBATALKAN: 'surface',
}

const notificationTone: Record<WhatsappMessageStatus, 'surface' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
}

const notificationLabel: Record<WhatsappMessageStatus, string> = {
  PENDING: 'Diproses',
  SUCCESS: 'Terkirim',
  FAILED: 'Gagal',
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Jakarta',
})

const timestampFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

function fileSizeLabel(size: number | null) {
  if (!size) return null
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`
}

function auditPayload(value: string | null) {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function historySummary(newData: string | null) {
  const data = auditPayload(newData)
  if (!data) return { title: 'Request diperbarui', detail: null }
  if (typeof data.status === 'string' && data.status in PAMFLET_STATUS_LABELS) {
    return {
      title: `Status diubah menjadi ${PAMFLET_STATUS_LABELS[data.status as PamfletWorkflowStatus]}`,
      detail: typeof data.notes === 'string' ? data.notes : null,
    }
  }
  if ('assigneeId' in data) {
    return {
      title: typeof data.assigneeName === 'string'
        ? `PIC ditugaskan kepada ${data.assigneeName}`
        : 'Penugasan PIC dihapus',
      detail: null,
    }
  }
  if (data.notificationRetry === true) {
    const success = typeof data.successfulDeliveries === 'number' ? data.successfulDeliveries : 0
    const failed = typeof data.failedDeliveries === 'number' ? data.failedDeliveries : 0
    return { title: 'Notifikasi dicoba ulang', detail: `${success} berhasil, ${failed} gagal.` }
  }
  return { title: 'Request diperbarui', detail: null }
}

export default async function RequestPamfletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const req = await getPamfletRequestById(id)
  if (!req) notFound()

  const [history, assignees, notificationDeliveries] = await Promise.all([
    getPamfletRequestHistory(id),
    getPamfletRequestAssignees(),
    getPamfletRequestNotificationDeliveries(id),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="border-b border-border pb-6">
        <ButtonLink href="/admin/request-pamflet" variant="ghost" size="sm" className="mb-4 -ml-3">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Inbox
        </ButtonLink>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words font-heading text-2xl font-extrabold tracking-tight text-primary md:text-4xl">{req.activityName}</h1>
              <Badge tone={statusTone[req.status]}>{PAMFLET_STATUS_LABELS[req.status]}</Badge>
            </div>
            <p className="mt-2 break-all font-mono text-sm text-text-secondary">{req.requestNumber}</p>
            <p className="mt-1 text-xs text-text-muted">Masuk {timestampFormatter.format(req.createdAt)}</p>
          </div>

          <div className="flex w-full flex-wrap items-end gap-2 xl:w-auto xl:justify-end">
            <CreateContentPlanDialog request={{
              id: req.id,
              requestNumber: req.requestNumber,
              activityName: req.activityName,
              deadline: req.deadline,
              status: req.status,
              assigneeId: req.assigneeId,
              hasAttachment: Boolean(req.attachmentPublicId),
              contentPlan: req.contentPlan ? { id: req.contentPlan.id } : null,
            }} assignees={assignees} />
            <StatusUpdater request={{ id: req.id, status: req.status }} />
            <AssignPamfletRequest
              requestId={req.id}
              assignees={assignees}
              currentAssigneeId={req.assigneeId}
            />
            {req.contentPlan ? (
              <ButtonLink href={`/admin/cms/content-plan?month=${contentPlanDateKey(req.contentPlan.publishDate).slice(0, 7)}`} variant="secondary" size="sm">
                Buka Content Plan
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Request</CardTitle>
              <CardDescription>Data kegiatan dan kebutuhan desain dari pengaju.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Program / Agenda</dt>
                  <dd className="mt-1 font-semibold text-primary">{req.program?.name ?? req.agenda?.name ?? 'Tidak terkait'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Tema</dt>
                  <dd className="mt-1 break-words text-primary">{req.theme || 'Tidak diisi'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Jenis kebutuhan</dt>
                  <dd className="mt-1 font-semibold text-primary">{req.requestType}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Deadline Komdigi</dt>
                  <dd className="mt-1 inline-flex items-center gap-2 font-semibold text-danger">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {dateFormatter.format(req.deadline)}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-border pt-5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">Informasi yang harus dicantumkan</h2>
                <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-primary">{req.description}</p>
              </div>

              {req.caption ? (
                <div className="border-t border-border pt-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">Saran caption</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-primary">{req.caption}</p>
                </div>
              ) : null}

              {req.requesterNotes ? (
                <div className="border-t border-border pt-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">Catatan pengaju</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words rounded-md bg-info-surface p-4 leading-7 text-info-foreground">{req.requesterNotes}</p>
                </div>
              ) : null}

              {req.notes ? (
                <div className="border-t border-border pt-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">Catatan internal terakhir</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words rounded-md bg-warning-surface p-4 leading-7 text-warning-foreground">{req.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lampiran & Referensi</CardTitle>
              <CardDescription>Lampiran privat hanya dapat dibuka oleh dashboard yang berwenang.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {req.referenceLink ? (
                <a href={req.referenceLink} target="_blank" rel="noreferrer" className="flex min-h-16 items-center gap-3 py-3 text-sm transition-colors hover:text-accent">
                  <LinkIcon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="min-w-0"><strong className="block text-primary">Link referensi desain</strong><span className="block truncate text-xs text-text-secondary">{req.referenceLink}</span></span>
                </a>
              ) : <p className="py-4 text-sm text-text-secondary">Tidak ada link referensi.</p>}

              {req.attachmentPublicId ? (
                <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0"><strong className="block truncate text-sm text-primary">{req.attachmentOriginalName ?? 'Lampiran Request'}</strong><span className="block text-xs text-text-secondary">{[req.attachmentMimeType, fileSizeLabel(req.attachmentSize)].filter(Boolean).join(' · ')}</span></span>
                  </div>
                  <ButtonLink href={`/api/private/pamflet-requests/${req.id}`} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Buka lampiran
                  </ButtonLink>
                </div>
              ) : <p className="py-4 text-sm text-text-secondary">Tidak ada file lampiran.</p>}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pengaju</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-alt text-primary"><User className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="break-words font-semibold text-primary">{req.requesterName}</p><p className="break-words text-text-secondary">{req.requesterUnit}</p></div>
              </div>
              <a href={`https://wa.me/${req.requesterWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 font-medium text-accent hover:underline">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {req.requesterWhatsapp}
              </a>
              {req.contactPerson ? <div className="border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-wide text-text-muted">Contact Person pada pamflet</p><p className="mt-1 break-words text-primary">{req.contactPerson}</p></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pelaksanaan</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-primary">
              <p className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>{req.eventDate ? dateFormatter.format(req.eventDate) : 'Tanggal belum ditentukan'}</span></p>
              {req.eventTime ? <p className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>{req.eventTime}</span></p> : null}
              {req.location ? <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span className="break-words">{req.location}</span></p> : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><CardTitle>Status Notifikasi WhatsApp</CardTitle><CardDescription>Nomor recipient disamarkan; token provider tidak pernah ditampilkan.</CardDescription></div>
          <NotificationRetryButton requestId={req.id} />
        </CardHeader>
        <CardContent>
          {notificationDeliveries.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {notificationDeliveries.map((delivery, index) => {
                const timestamp = delivery.sentAt ?? delivery.failedAt ?? delivery.updatedAt
                return (
                  <li key={`${delivery.recipient}-${index}`} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-primary">{delivery.recipient}</strong><Badge tone={notificationTone[delivery.status]}>{notificationLabel[delivery.status]}</Badge></div>
                      <p className="mt-1 text-xs text-text-secondary">Percobaan {delivery.attemptCount} · {timestampFormatter.format(timestamp)}</p>
                      {delivery.errorMessage ? <p className="mt-2 break-words text-xs text-danger">{delivery.errorMessage}</p> : null}
                    </div>
                    {delivery.providerMessageId ? <p className="break-all font-mono text-xs text-text-muted">Ref: {delivery.providerMessageId}</p> : null}
                  </li>
                )
              })}
            </ul>
          ) : <p className="text-sm text-text-secondary">Belum ada percobaan notifikasi untuk request ini.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat Request</CardTitle><CardDescription>Perubahan status, PIC, dan percobaan notifikasi tercatat di sini.</CardDescription></CardHeader>
        <CardContent>
          {history.length ? (
            <ol className="space-y-4">
              {history.map((entry, index) => {
                const summary = historySummary(entry.newData)
                return (
                  <li key={`${entry.createdAt.toISOString()}-${index}`} className="border-l-2 border-accent/40 pl-4 text-sm">
                    <p className="font-semibold text-primary">{summary.title}</p>
                    {summary.detail ? <p className="mt-1 whitespace-pre-wrap break-words text-text-secondary">{summary.detail}</p> : null}
                    <p className="mt-1 text-xs text-text-muted">{timestampFormatter.format(entry.createdAt)} · {entry.user?.name ?? 'Sistem'}</p>
                  </li>
                )
              })}
            </ol>
          ) : <p className="text-sm text-text-secondary">Belum ada riwayat perubahan oleh admin.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
