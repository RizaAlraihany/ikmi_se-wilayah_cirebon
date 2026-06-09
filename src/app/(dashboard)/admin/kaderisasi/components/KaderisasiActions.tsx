'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowUpRight } from 'lucide-react'
import { verifyRegistrationAction, promoteToActiveAction } from '@/features/membership/actions'
import { Textarea } from '@/components/ui/textarea'

export function KaderisasiActions({ registrationId, status }: { registrationId: string, status: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [notes, setNotes] = useState({ interview: '', administrasi: '', followUp: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionType) return
    
    setLoading(true)
    const res = await verifyRegistrationAction(registrationId, actionType, notes)
    setLoading(false)
    if (res.success) {
      setIsOpen(false)
    } else {
      alert(res.error)
    }
  }

  const handlePromote = async () => {
    if (!confirm('Apakah Anda yakin ingin mempromosikan calon ini menjadi Anggota Aktif? Ini akan membuat akun User untuk anggota ini.')) return
    
    setLoading(true)
    const res = await promoteToActiveAction(registrationId)
    setLoading(false)
    if (!res.success) {
      alert(res.error)
    } else {
      alert('Berhasil dipromosikan ke Anggota Aktif!')
    }
  }

  if (status === 'APPROVED') {
    return (
      <Button size="sm" onClick={handlePromote} disabled={loading}>
        <ArrowUpRight className="w-4 h-4 mr-2" />
        Promosikan ke Anggota Aktif
      </Button>
    )
  }

  if (status !== 'PENDING') return null

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background w-full max-w-lg rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Verifikasi Calon Anggota</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Catatan Administrasi</label>
              <Textarea 
                value={notes.administrasi} 
                onChange={e => setNotes({...notes, administrasi: e.target.value})} 
                placeholder="Hasil pengecekan kelengkapan..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catatan Interview</label>
              <Textarea 
                value={notes.interview} 
                onChange={e => setNotes({...notes, interview: e.target.value})} 
                placeholder="Hasil wawancara PRABUMI..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catatan Follow Up</label>
              <Textarea 
                value={notes.followUp} 
                onChange={e => setNotes({...notes, followUp: e.target.value})} 
                placeholder="Keterangan tambahan..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" variant="danger" onClick={() => setActionType('REJECTED')} disabled={loading}>Tolak</Button>
              <Button type="submit" variant="primary" onClick={() => setActionType('APPROVED')} disabled={loading}>Setujui</Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <Button size="sm" onClick={() => setIsOpen(true)}>
      <CheckCircle className="w-4 h-4 mr-2" />
      Verifikasi
    </Button>
  )
}
