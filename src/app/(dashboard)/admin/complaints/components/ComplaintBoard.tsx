'use client'

import { useState } from 'react'
import { ComplaintStatus } from '@prisma/client'
import { MessageSquare } from 'lucide-react'
import { processComplaintAction } from '@/features/complaints/actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/input'

type Complaint = {
  id: string
  senderName: string
  campus: string
  category: string
  message: string
  status: ComplaintStatus
  createdAt: Date
}

const statusLabels: Record<ComplaintStatus, string> = {
  UNREAD: 'Belum dibaca',
  PROCESSED: 'Diproses',
  RESOLVED: 'Selesai',
  REJECTED: 'Ditolak',
}

const statusTones: Record<ComplaintStatus, React.ComponentProps<typeof Badge>['tone']> = {
  UNREAD: 'danger',
  PROCESSED: 'accent',
  RESOLVED: 'success',
  REJECTED: 'surface',
}

function isComplaintStatus(value: string): value is ComplaintStatus {
  return value === 'UNREAD' || value === 'PROCESSED' || value === 'RESOLVED' || value === 'REJECTED'
}

export function ComplaintBoard({ initialComplaints }: { initialComplaints: Complaint[] }) {
  const [complaints, setComplaints] = useState(initialComplaints)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleUpdateStatus(id: string, newStatus: ComplaintStatus) {
    setIsProcessing(id)
    setError('')
    const result = await processComplaintAction(id, { status: newStatus })
    if (!result.error) {
      setComplaints((prev) => prev.map((complaint) => (
        complaint.id === id ? { ...complaint, status: newStatus } : complaint
      )))
    } else {
      setError(result.error)
    }
    setIsProcessing(null)
  }

  if (complaints.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Belum ada aduan"
        description="Aduan mahasiswa yang masuk akan muncul di halaman ini."
      />
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:hidden">
        {complaints.map((complaint) => (
          <Card key={complaint.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-base font-bold text-primary">{complaint.senderName}</p>
                  <p className="text-sm text-muted">{complaint.campus}</p>
                </div>
                <Badge tone={statusTones[complaint.status]}>{statusLabels[complaint.status]}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{complaint.category}</p>
                <p className="text-sm leading-6 text-primary/80">{complaint.message}</p>
                <p className="text-xs text-muted">{new Date(complaint.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
              <Select
                aria-label={`Ubah status aduan dari ${complaint.senderName}`}
                disabled={isProcessing === complaint.id}
                value={complaint.status}
                onChange={(event) => {
                  const nextStatus = event.currentTarget.value
                  if (isComplaintStatus(nextStatus)) {
                    handleUpdateStatus(complaint.id, nextStatus)
                  }
                }}
              >
                <option value="UNREAD">Belum dibaca</option>
                <option value="PROCESSED">Diproses</option>
                <option value="RESOLVED">Selesai</option>
                <option value="REJECTED">Ditolak</option>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4">Pengirim</th>
                <th className="px-5 py-4">Kategori</th>
                <th className="px-5 py-4">Pesan</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="transition-colors hover:bg-background">
                  <td className="whitespace-nowrap px-5 py-4 text-muted">
                    {new Date(complaint.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="block font-semibold text-primary">{complaint.senderName}</span>
                    <span className="block text-xs text-muted">{complaint.campus}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-primary/80">{complaint.category}</td>
                  <td className="px-5 py-4">
                    <p className="line-clamp-2 max-w-md text-primary/80" title={complaint.message}>
                      {complaint.message}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <Badge tone={statusTones[complaint.status]}>{statusLabels[complaint.status]}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <Select
                      aria-label={`Ubah status aduan dari ${complaint.senderName}`}
                      className="h-9 min-w-40 text-xs"
                      disabled={isProcessing === complaint.id}
                      value={complaint.status}
                      onChange={(event) => {
                        const nextStatus = event.currentTarget.value
                        if (isComplaintStatus(nextStatus)) {
                          handleUpdateStatus(complaint.id, nextStatus)
                        }
                      }}
                    >
                      <option value="UNREAD">Belum dibaca</option>
                      <option value="PROCESSED">Diproses</option>
                      <option value="RESOLVED">Selesai</option>
                      <option value="REJECTED">Ditolak</option>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
