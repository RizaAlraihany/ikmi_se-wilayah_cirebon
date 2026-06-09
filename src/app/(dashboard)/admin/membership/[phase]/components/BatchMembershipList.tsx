'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

type MembershipListMember = {
  id: string
  name: string
  email: string
  isActive: boolean
  registration?: { campus: string; major: string } | null
  department?: { name: string } | null
  position?: { name: string } | null
}

export function BatchMembershipList({ members, phaseKey }: { members: MembershipListMember[], phaseKey: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(members.map(m => m.id))
    }
  }

  const handleBulkPromote = async () => {
    // In a real implementation we would open a dialog to select department and position.
    // For now, we'll just alert that it requires a dialog or custom implementation.
    alert(`Bulk assign untuk ${selectedIds.length} anggota akan membuka modal pilihan departemen/jabatan (Akan diimplementasi lebih lanjut).`)
  }

  return (
    <div className="space-y-4">
      {members.length > 0 && phaseKey === 'ACTIVE' && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-line">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={selectedIds.length === members.length && members.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">
              Pilih Semua ({selectedIds.length} terpilih)
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkPromote} disabled={selectedIds.length === 0}>
              Assign Pengurus
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {members.map((member) => (
          <Card key={member.id} className={`transition-colors ${selectedIds.includes(member.id) ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}`}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                {phaseKey === 'ACTIVE' && (
                  <Checkbox 
                    className="mt-1"
                    checked={selectedIds.includes(member.id)}
                    onCheckedChange={() => toggleSelect(member.id)}
                  />
                )}
                <div>
                  <Link href={`/admin/membership/profile/${member.id}`} className="hover:underline">
                    <h3 className="font-heading text-lg font-bold text-primary">{member.name}</h3>
                  </Link>
                  <p className="text-sm text-muted">{member.email}</p>
                  {member.registration && (
                     <p className="text-xs text-muted-foreground mt-1">{member.registration.campus} - {member.registration.major}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {member.department && (
                  <Badge variant="secondary">{member.department.name}</Badge>
                )}
                {member.position && (
                  <Badge>{member.position.name}</Badge>
                )}
                {!member.isActive && <Badge variant="secondary" className="bg-red-100 text-red-800">Inactive</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
