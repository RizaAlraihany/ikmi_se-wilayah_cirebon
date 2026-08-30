'use client'

import { Archive, CalendarClock, Check, RotateCcw, Send, Trash2, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  approvePostAction,
  archivePostAction,
  deletePostAction,
  publishPostAction,
  requestPostRevisionAction,
  schedulePostAction,
  submitPostForReviewAction,
} from '@/features/blog/actions'

type WorkflowAction = 'submit' | 'approve' | 'publish' | 'archive' | 'delete' | 'revision' | 'schedule'

export function PostWorkflowActions({ postId, status }: { postId: string; status: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [pending, setPending] = useState<WorkflowAction | null>(null)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function finish(action: WorkflowAction, result: { success?: boolean; error?: string }) {
    setPending(null)
    if (result.error) {
      setMessage({ tone: 'danger', text: result.error })
      return
    }
    if (action === 'delete') {
      router.push('/admin/cms/posts')
      router.refresh()
      return
    }
    setRevisionOpen(false)
    setScheduleOpen(false)
    setDeleteOpen(false)
    setMessage({ tone: 'success', text: 'Workflow publikasi berhasil diperbarui.' })
    router.refresh()
  }

  async function run(action: Exclude<WorkflowAction, 'revision' | 'schedule'>) {
    setPending(action)
    setMessage(null)
    const result = action === 'submit'
      ? await submitPostForReviewAction(postId)
      : action === 'approve'
        ? await approvePostAction(postId)
        : action === 'publish'
          ? await publishPostAction(postId)
          : action === 'archive'
            ? await archivePostAction(postId)
            : await deletePostAction(postId)
    await finish(action, result)
  }

  async function submitRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending('revision')
    setMessage(null)
    const notes = String(new FormData(event.currentTarget).get('revisionNotes') || '')
    await finish('revision', await requestPostRevisionAction(postId, notes))
  }

  async function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending('schedule')
    setMessage(null)
    const scheduledAt = String(new FormData(event.currentTarget).get('scheduledAt') || '')
    await finish('schedule', await schedulePostAction(postId, scheduledAt))
  }

  return (
    <div className="space-y-3">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {status === 'DRAFT' || status === 'REVISION' ? (
          <Button type="button" size="sm" onClick={() => void run('submit')} disabled={Boolean(pending)}><Send className="h-4 w-4" aria-hidden="true" />Kirim Review</Button>
        ) : null}
        {status === 'PENDING_REVIEW' ? (
          <>
            <Button type="button" size="sm" onClick={() => void run('approve')} disabled={Boolean(pending)}><Check className="h-4 w-4" aria-hidden="true" />Setujui</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRevisionOpen(true)} disabled={Boolean(pending)}><RotateCcw className="h-4 w-4" aria-hidden="true" />Minta Revisi</Button>
          </>
        ) : null}
        {status === 'APPROVED' ? (
          <>
            <Button type="button" size="sm" onClick={() => void run('publish')} disabled={Boolean(pending)}><UploadCloud className="h-4 w-4" aria-hidden="true" />Publikasikan</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setScheduleOpen(true)} disabled={Boolean(pending)}><CalendarClock className="h-4 w-4" aria-hidden="true" />Jadwalkan</Button>
          </>
        ) : null}
        {status === 'SCHEDULED' ? <Button type="button" size="sm" onClick={() => void run('publish')} disabled={Boolean(pending)}><UploadCloud className="h-4 w-4" aria-hidden="true" />Publikasikan Sekarang</Button> : null}
        {status !== 'ARCHIVED' ? <Button type="button" variant="secondary" size="sm" onClick={() => void run('archive')} disabled={Boolean(pending)}><Archive className="h-4 w-4" aria-hidden="true" />Arsipkan</Button> : null}
        <Button type="button" variant="danger" size="sm" onClick={() => setDeleteOpen(true)} disabled={Boolean(pending)}><Trash2 className="h-4 w-4" aria-hidden="true" />Hapus</Button>
      </div>

      <Sheet open={revisionOpen} onOpenChange={setRevisionOpen} title="Kembalikan untuk revisi" description="Catatan ini akan terlihat oleh penulis pada form edit.">
        <form onSubmit={submitRevision} className="space-y-5">
          <Field label="Catatan revisi" htmlFor="revision-notes" required><Textarea id="revision-notes" name="revisionNotes" required minLength={5} maxLength={3000} rows={6} /></Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setRevisionOpen(false)} disabled={Boolean(pending)}>Batal</Button><Button type="submit" disabled={Boolean(pending)}>{pending === 'revision' ? 'Menyimpan…' : 'Kirim Revisi'}</Button></div>
        </form>
      </Sheet>

      <Sheet open={scheduleOpen} onOpenChange={setScheduleOpen} title="Jadwalkan publikasi" description="Waktu menggunakan zona Asia/Jakarta. Artikel tetap privat sampai dipublikasikan.">
        <form onSubmit={submitSchedule} className="space-y-5">
          <Field label="Tanggal dan waktu publikasi" htmlFor="scheduled-at" required><Input id="scheduled-at" name="scheduledAt" type="datetime-local" required /></Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setScheduleOpen(false)} disabled={Boolean(pending)}>Batal</Button><Button type="submit" disabled={Boolean(pending)}>{pending === 'schedule' ? 'Menjadwalkan…' : 'Simpan Jadwal'}</Button></div>
        </form>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Hapus publikasi?" description="Publikasi akan dihapus secara lunak dari CMS dan website publik. Riwayat audit tetap tersedia.">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} disabled={Boolean(pending)}>Batal</Button><Button type="button" variant="danger" onClick={() => void run('delete')} disabled={Boolean(pending)}>{pending === 'delete' ? 'Menghapus…' : 'Ya, Hapus'}</Button></div>
      </Sheet>
    </div>
  )
}
