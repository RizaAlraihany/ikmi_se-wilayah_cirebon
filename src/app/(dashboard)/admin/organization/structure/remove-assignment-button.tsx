'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { removeStructureAssignmentAction } from '@/features/structure/actions'
import { Dialog } from '@/components/ui/dialog'
import { Alert } from '@/components/ui/alert'

export function RemoveAssignmentButton({ assignmentId, memberName }: { assignmentId: string, memberName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRemove() {
    setIsLoading(true)
    setError('')
    try {
      const res = await removeStructureAssignmentAction(assignmentId)
      if (res.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(res.message || 'Penugasan tidak dapat diarsipkan.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="text-danger hover:text-danger hover:bg-danger-surface" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Arsipkan Penugasan"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Arsipkan penugasan <strong>{memberName}</strong> dari jabatan ini? Riwayat periode tetap tersimpan dan pengurus dapat ditugaskan kembali bila diperlukan.
          </p>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              {isLoading ? 'Mengarsipkan...' : 'Ya, Arsipkan'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
