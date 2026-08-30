'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { createArticleDraftFromKaryaTulisAction, requestKaryaTulisRevisionAction, setKaryaTulisReviewStatusAction } from '@/features/kirim-tulisan/actions'

export function WritingReviewActions({ id, status, articleDraftId }: { id: string; status: string; articleDraftId?: string | null }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [revisionLink, setRevisionLink] = useState<string | null>(null)

  async function askRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      const notes = String(new FormData(event.currentTarget).get('notes') || '')
      const result = await requestKaryaTulisRevisionAction(id, notes)
      setRevisionLink(`${window.location.origin}${result.revisionPath}`)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tautan revisi gagal dibuat.')
    } finally { setIsSaving(false) }
  }

  async function setStatus(nextStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED') {
    setIsSaving(true)
    setMessage(null)
    try {
      await setKaryaTulisReviewStatusAction(id, nextStatus)
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Status gagal diperbarui.') }
    finally { setIsSaving(false) }
  }

  async function createDraft() {
    setIsSaving(true)
    setMessage(null)
    try {
      const result = await createArticleDraftFromKaryaTulisAction(id)
      router.push(`/admin/cms/posts/${result.postId}`)
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Draft Artikel gagal dibuat.') }
    finally { setIsSaving(false) }
  }

  return <div className="space-y-2">
    {message ? <Alert tone="danger">{message}</Alert> : null}
    <div className="flex flex-wrap gap-2">
      {['SUBMITTED', 'RESUBMITTED'].includes(status) ? <Button type="button" variant="secondary" size="sm" disabled={isSaving} onClick={() => void setStatus('UNDER_REVIEW')}>Mulai review</Button> : null}
      {status === 'UNDER_REVIEW' ? <><Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => { setRevisionLink(null); setRevisionOpen(true) }}>Minta revisi</Button><Button type="button" variant="secondary" size="sm" disabled={isSaving} onClick={() => void setStatus('APPROVED')}>Setujui</Button><Button type="button" variant="danger" size="sm" disabled={isSaving} onClick={() => void setStatus('REJECTED')}>Tolak</Button></> : null}
      {status === 'APPROVED' ? <Button type="button" size="sm" disabled={isSaving} onClick={() => void createDraft()}>Buat Article Draft</Button> : null}
      {articleDraftId ? <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/admin/cms/posts/${articleDraftId}`)}>Buka Draft</Button> : null}
    </div>

    <Sheet open={revisionOpen} onOpenChange={setRevisionOpen} title="Minta revisi tulisan" description="Tautan privat berlaku 14 hari dan hanya dapat dipakai satu kali.">
      {revisionLink ? <div className="space-y-4"><Alert tone="success" title="Tautan revisi siap">Salin tautan berikut dan kirimkan langsung kepada penulis.</Alert><p className="break-all rounded-md bg-surface-alt p-3 font-mono text-xs text-primary">{revisionLink}</p><Button type="button" onClick={() => void navigator.clipboard?.writeText(revisionLink)}>Salin Tautan</Button></div> : <form onSubmit={askRevision} className="space-y-5"><Field label="Catatan revisi" htmlFor={`revision-${id}`} required><Textarea id={`revision-${id}`} name="notes" minLength={5} maxLength={3000} required rows={6} /></Field><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setRevisionOpen(false)} disabled={isSaving}>Batal</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Membuat…' : 'Buat Tautan Revisi'}</Button></div></form>}
    </Sheet>
  </div>
}
