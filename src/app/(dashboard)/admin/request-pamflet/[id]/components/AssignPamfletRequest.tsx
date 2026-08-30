'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Select } from '@/components/ui/input'
import { assignPamfletRequest } from '@/features/request-pamflet/admin-actions'

type Assignee = { id: string; name: string }

export function AssignPamfletRequest({ requestId, assignees, currentAssigneeId }: { requestId: string; assignees: Assignee[]; currentAssigneeId: string | null }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onChange(value: string) {
    setIsSaving(true)
    setError(null)
    try {
      await assignPamfletRequest(requestId, value || null)
      router.refresh()
    } catch {
      setError('PIC gagal diperbarui.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="min-w-48">
    <label htmlFor="pamflet-assignee" className="mb-1 block text-xs font-bold text-text-secondary">PIC Request</label>
    <div className="flex items-center gap-2">
      <Select id="pamflet-assignee" defaultValue={currentAssigneeId ?? ''} disabled={isSaving} onChange={(event) => onChange(event.target.value)} className="text-xs">
        <option value="">Belum ditugaskan</option>
        {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
      </Select>
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-label="Menyimpan PIC" /> : null}
    </div>
    {error ? <p role="alert" className="mt-1 text-xs text-danger">{error}</p> : null}
  </div>
}
