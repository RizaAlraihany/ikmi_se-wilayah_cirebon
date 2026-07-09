'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { verifyReportAction, rejectReportAction } from '@/features/reports/actions'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  reportId: string
  status: string
  canVerify: boolean
}

export function ReportActions({ reportId, status, canVerify }: Props) {
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    await verifyReportAction(reportId)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('Tolak laporan ini?')) return
    setLoading(true)
    await rejectReportAction(reportId)
    setLoading(false)
  }

  if (status === 'REJECTED' || status === 'VERIFIED') return null

  return (
    <div className="flex gap-2">
      {status === 'SUBMITTED' && canVerify && (
        <Button size="sm" onClick={handleVerify} disabled={loading} className="bg-success text-success-foreground hover:bg-success/90">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Verifikasi LPJ
        </Button>
      )}

      {canVerify && (
        <Button size="sm" variant="secondary" onClick={handleReject} disabled={loading} className="text-danger hover:text-danger hover:bg-danger/10">
          <XCircle className="w-4 h-4 mr-1" />
          Tolak LPJ
        </Button>
      )}
    </div>
  )
}
