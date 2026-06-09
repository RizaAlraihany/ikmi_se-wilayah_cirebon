'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { verifyDepartmentReportAction, verifyBphReportAction, rejectReportAction } from '@/features/reports/actions'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  reportId: string
  status: string
  canVerifyDept: boolean
  canVerifyBph: boolean
}

export function ReportActions({ reportId, status, canVerifyDept, canVerifyBph }: Props) {
  const [loading, setLoading] = useState(false)

  const handleVerifyDept = async () => {
    setLoading(true)
    await verifyDepartmentReportAction(reportId)
    setLoading(false)
  }

  const handleVerifyBph = async () => {
    setLoading(true)
    await verifyBphReportAction(reportId)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('Tolak laporan ini?')) return
    setLoading(true)
    await rejectReportAction(reportId)
    setLoading(false)
  }

  if (status === 'REJECTED' || status === 'VERIFIED_BPH') return null

  return (
    <div className="flex gap-2">
      {status === 'SUBMITTED' && canVerifyDept && (
        <Button size="sm" onClick={handleVerifyDept} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Verifikasi (Kadep)
        </Button>
      )}
      
      {status === 'VERIFIED_DEPARTMENT' && canVerifyBph && (
        <Button size="sm" onClick={handleVerifyBph} disabled={loading} className="bg-success text-success-foreground hover:bg-success/90">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Verifikasi Final (BPH)
        </Button>
      )}

      {(canVerifyDept || canVerifyBph) && (
        <Button size="sm" variant="secondary" onClick={handleReject} disabled={loading} className="text-danger hover:text-danger hover:bg-danger/10">
          <XCircle className="w-4 h-4 mr-1" />
          Tolak LPJ
        </Button>
      )}
    </div>
  )
}
