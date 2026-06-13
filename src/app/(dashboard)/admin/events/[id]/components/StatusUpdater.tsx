'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { updateEventAction } from '@/features/events/actions'
import type { EventStatus } from '@prisma/client'

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function StatusUpdater({ eventId, currentStatus }: { eventId: string, currentStatus: EventStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState<EventStatus>(currentStatus === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async (nextStatus: EventStatus) => {
    const previousStatus = status
    setStatus(nextStatus)
    setLoading(true)
    setError(null)
    const result = await updateEventAction(eventId, { status: nextStatus })
    if (result.error) {
      setStatus(previousStatus)
      setError(result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <ListboxSelect
        value={status}
        options={statusOptions}
        disabled={loading || status === 'COMPLETED'}
        onValueChange={(nextValue) => handleUpdate(nextValue as EventStatus)}
      />
      {status === 'COMPLETED' ? (
        <p className="text-sm font-semibold text-text-secondary">
          Agenda completed sudah dikunci dan tidak bisa diubah statusnya.
        </p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  )
}
