'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { updatePamfletRequestStatus } from '@/features/request-pamflet/admin-actions'
import {
  allowedPamfletStatusTransitions,
  PAMFLET_STATUS_LABELS,
  PAMFLET_STATUSES_REQUIRING_NOTES,
  type PamfletWorkflowStatus,
} from '@/features/request-pamflet/domain'

export function StatusUpdater({ request }: { request: { id: string; status: PamfletWorkflowStatus } }) {
  const router = useRouter()
  const transitions = allowedPamfletStatusTransitions(request.status)
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PamfletWorkflowStatus | null>(transitions[0] ?? null)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedStatus) return
    setIsUpdating(true)
    setError(null)
    try {
      await updatePamfletRequestStatus(request.id, selectedStatus, notes)
      setOpen(false)
      setNotes('')
      router.refresh()
    } catch {
      setError('Status belum dapat diperbarui. Periksa catatan atau muat ulang halaman lalu coba lagi.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (transitions.length === 0) {
    return <Button variant="secondary" size="sm" disabled>Status final</Button>
  }

  const notesRequired = selectedStatus
    ? PAMFLET_STATUSES_REQUIRING_NOTES.includes(selectedStatus)
    : false

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Ubah status
      </Button>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isUpdating) setOpen(nextOpen)
        }}
        title="Ubah status Request"
        description={`Status saat ini: ${PAMFLET_STATUS_LABELS[request.status]}. Pilih langkah workflow berikutnya.`}
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          {error ? <Alert tone="danger" title="Status belum tersimpan">{error}</Alert> : null}

          <fieldset>
            <legend className="text-sm font-bold text-primary">Status berikutnya</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {transitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={selectedStatus === status}
                  onClick={() => {
                    setSelectedStatus(status)
                    setError(null)
                  }}
                  className="min-h-11 rounded-md border border-border bg-surface px-4 text-left text-sm font-semibold text-primary transition hover:border-accent aria-pressed:border-accent aria-pressed:bg-info-surface aria-pressed:text-info-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {PAMFLET_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </fieldset>

          <Field
            label={notesRequired ? 'Catatan internal' : 'Catatan internal (opsional)'}
            htmlFor="pamflet-status-notes"
            required={notesRequired}
            description={notesRequired ? 'Jelaskan alasan atau detail revisi minimal 5 karakter.' : 'Catatan lama tetap tersimpan bila kolom ini dikosongkan.'}
          >
            <Textarea
              id="pamflet-status-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              minLength={notesRequired ? 5 : undefined}
              maxLength={3000}
              rows={4}
              required={notesRequired}
              disabled={isUpdating}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
              Batal
            </Button>
            <Button type="submit" disabled={isUpdating || !selectedStatus}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              Simpan status
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  )
}
