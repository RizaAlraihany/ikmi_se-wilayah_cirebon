'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { approveTier1Action, approveTier2Action, rejectRequestAction } from '@/features/finance/actions'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  requestId: string
  status: string
  canApproveTier1: boolean
  canApproveTier2: boolean
}

export function FinanceActions({ requestId, status, canApproveTier1, canApproveTier2 }: Props) {
  const [loading, setLoading] = useState(false)

  const handleApprove1 = async () => {
    setLoading(true)
    await approveTier1Action(requestId)
    setLoading(false)
  }

  const handleApprove2 = async () => {
    setLoading(true)
    await approveTier2Action(requestId)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('Tolak pengajuan dana ini?')) return
    setLoading(true)
    await rejectRequestAction(requestId)
    setLoading(false)
  }

  if (status === 'REJECTED' || status === 'COMPLETED') return null

  return (
    <div className="flex gap-2 mt-4 pt-4 border-t">
      {status === 'PENDING' && canApproveTier1 && (
        <Button size="sm" onClick={handleApprove1} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Approve (Kadep)
        </Button>
      )}
      
      {status === 'APPROVED_TIER1' && canApproveTier2 && (
        <Button size="sm" onClick={handleApprove2} disabled={loading} className="bg-success text-success-foreground hover:bg-success/90">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Cairkan Dana (Bendum)
        </Button>
      )}

      {(canApproveTier1 || canApproveTier2) && (
        <Button size="sm" variant="outline" onClick={handleReject} disabled={loading} className="text-danger hover:text-danger hover:bg-danger/10">
          <XCircle className="w-4 h-4 mr-1" />
          Tolak
        </Button>
      )}
    </div>
  )
}
