'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, AlertTriangle } from 'lucide-react'
import { archiveAgendaAction } from '@/features/agendas/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AgendaArchiveButton({ id, isArchived }: { id: string; isArchived: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  async function handleArchive() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setLoading(true)
    setError('')
    const result = await archiveAgendaAction(id)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Gagal mengarsipkan agenda.')
      setConfirmed(false)
      return
    }
    router.push('/admin/agendas')
    router.refresh()
  }

  if (isArchived) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-text-secondary">
          Agenda ini sudah diarsipkan dan tidak dapat diedit.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Arsipkan Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-text-secondary">
          Agenda yang diarsipkan tidak akan muncul di kalender publik dan tidak dapat diedit.
          Data agenda tetap tersimpan untuk keperluan riwayat.
        </p>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm font-semibold text-primary">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            {error}
          </p>
        )}

        {confirmed && (
          <p className="rounded-xl border border-warning/25 bg-warning-surface p-3 text-sm font-semibold text-warning-foreground">
            Klik sekali lagi untuk konfirmasi pengarsipan.
          </p>
        )}

        <Button
          variant="destructive"
          onClick={handleArchive}
          disabled={loading}
          className="w-full"
        >
          <Archive className="mr-2 h-4 w-4" />
          {loading ? 'Mengarsipkan…' : confirmed ? 'Konfirmasi Arsipkan' : 'Arsipkan Agenda'}
        </Button>
      </CardContent>
    </Card>
  )
}
