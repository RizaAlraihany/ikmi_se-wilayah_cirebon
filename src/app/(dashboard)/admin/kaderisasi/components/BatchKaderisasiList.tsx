'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KaderisasiActions } from './KaderisasiActions'
import { Checkbox } from '@/components/ui/checkbox'
import { bulkVerifyRegistrationAction, bulkPromoteToActiveAction } from '@/features/membership/actions'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

type KaderisasiRegistration = {
  id: string
  createdAt: Date | string
  fullName: string
  campus: string
  semester: string
  whatsapp: string
  status: string
}

export function BatchKaderisasiList({ data, isPending }: { data: KaderisasiRegistration[], isPending: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(d => d.id))
    }
  }

  const handleBulkApprove = async () => {
    if (!confirm(`Terima ${selectedIds.length} pendaftar?`)) return
    setLoading(true)
    const res = await bulkVerifyRegistrationAction(selectedIds, 'APPROVED', { administrasi: 'Bulk Approve' })
    setLoading(false)
    if (res.success) {
      setSelectedIds([])
    } else {
      alert(res.error)
    }
  }

  const handleBulkReject = async () => {
    if (!confirm(`Tolak ${selectedIds.length} pendaftar?`)) return
    setLoading(true)
    const res = await bulkVerifyRegistrationAction(selectedIds, 'REJECTED', { administrasi: 'Bulk Reject' })
    setLoading(false)
    if (res.success) {
      setSelectedIds([])
    } else {
      alert(res.error)
    }
  }

  const handleBulkPromote = async () => {
    if (!confirm(`Promosikan ${selectedIds.length} calon anggota menjadi Anggota Aktif?`)) return
    setLoading(true)
    const res = await bulkPromoteToActiveAction(selectedIds)
    setLoading(false)
    if (res.success) {
      setSelectedIds([])
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-4">
      {data.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-line">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={selectedIds.length === data.length && data.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">
              Pilih Semua ({selectedIds.length} terpilih)
            </span>
          </div>
          <div className="flex gap-2">
            {isPending ? (
              <>
                <Button size="sm" variant="outline" onClick={handleBulkReject} disabled={selectedIds.length === 0 || loading}>
                  Tolak
                </Button>
                <Button size="sm" onClick={handleBulkApprove} disabled={selectedIds.length === 0 || loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Terima
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleBulkPromote} disabled={selectedIds.length === 0 || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Promosikan Aktif
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {data.map((registration) => (
          <Card key={registration.id} className={selectedIds.includes(registration.id) ? 'border-primary/50' : ''}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Checkbox 
                  className="mt-1"
                  checked={selectedIds.includes(registration.id)}
                  onCheckedChange={() => toggleSelect(registration.id)}
                />
                <div>
                  <p className="text-xs font-semibold text-muted">{new Date(registration.createdAt).toLocaleDateString('id-ID')}</p>
                  <Link href={`/admin/kaderisasi/${registration.id}`} className="hover:underline">
                    <h3 className="font-heading text-lg font-bold text-primary">{registration.fullName}</h3>
                  </Link>
                  <p className="text-sm text-muted">{registration.campus} - Semester {registration.semester}</p>
                  <p className="text-sm mt-1">WA: {registration.whatsapp}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isPending ? 'secondary' : 'default'}>{registration.status}</Badge>
                <KaderisasiActions registrationId={registration.id} status={registration.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
