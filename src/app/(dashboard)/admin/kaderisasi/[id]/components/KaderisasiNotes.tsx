'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addKaderisasiNoteAction } from '@/features/membership/actions'

type AuditLogEntry = {
  id: string
  newData: string | null
  createdAt: Date | string
  user?: { name: string | null } | null
}

export function KaderisasiNotes({ registrationId, logs }: { registrationId: string, logs: AuditLogEntry[] }) {
  const [loading, setLoading] = useState(false)
  const [noteType, setNoteType] = useState('interview')
  const [content, setContent] = useState('')

  const noteLogs = logs.filter(log => {
    try {
      const parsed = JSON.parse(log.newData || '{}')
      return parsed.type === 'NOTE'
    } catch {
      return false
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const res = await addKaderisasiNoteAction(registrationId, noteType, content)
    setLoading(false)
    if (res.success) {
      setContent('')
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Tipe Catatan</label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="administrasi">Administrasi</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Isi Catatan</label>
                <Textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Ketik catatan di sini..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !content.trim()}>
                {loading ? 'Menyimpan...' : 'Simpan Catatan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Catatan (Immutable)</CardTitle>
        </CardHeader>
        <CardContent>
          {noteLogs.length > 0 ? (
            <div className="space-y-4">
              {noteLogs.map(log => {
                const parsed = JSON.parse(log.newData || '{}')
                return (
                  <div key={log.id} className="p-4 bg-muted/50 rounded-lg border border-line">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2 py-1 bg-primary/10 rounded-md">
                          {parsed.noteType.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-foreground">{log.user?.name || 'Unknown Author'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{parsed.content}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Belum ada catatan untuk pendaftar ini.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
