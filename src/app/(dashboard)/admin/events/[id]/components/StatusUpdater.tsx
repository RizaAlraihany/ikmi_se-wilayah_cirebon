'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateEventAction } from '@/features/events/actions'
import type { EventStatus } from '@prisma/client'

export function StatusUpdater({ eventId, currentStatus }: { eventId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (status: EventStatus) => {
    setLoading(true)
    await updateEventAction(eventId, { status })
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant={currentStatus === 'UPCOMING' ? 'primary' : 'secondary'} 
        size="sm"
        disabled={loading}
        onClick={() => handleUpdate('UPCOMING')}
      >
        Upcoming
      </Button>
      <Button 
        variant={currentStatus === 'ONGOING' ? 'primary' : 'secondary'} 
        size="sm"
        disabled={loading}
        onClick={() => handleUpdate('ONGOING')}
      >
        Ongoing
      </Button>
      <Button 
        variant={currentStatus === 'COMPLETED' ? 'primary' : 'secondary'} 
        size="sm"
        className={currentStatus === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''}
        disabled={loading}
        onClick={() => handleUpdate('COMPLETED')}
      >
        Completed
      </Button>
      <Button 
        variant={currentStatus === 'CANCELLED' ? 'primary' : 'secondary'} 
        size="sm"
        className={currentStatus === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : ''}
        disabled={loading}
        onClick={() => handleUpdate('CANCELLED')}
      >
        Cancelled
      </Button>
    </div>
  )
}
