'use client'

type AuditLogEntry = {
  id: string
  action: string
  newData: string | null
  createdAt: Date | string
  user?: { name: string | null } | null
}

export function KaderisasiHistory({ logs }: { logs: AuditLogEntry[] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat aktivitas.</p>
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        let message = `Action: ${log.action}`
        try {
          if (log.newData) {
            const parsed = JSON.parse(log.newData)
            if (parsed.message) message = parsed.message
            else if (parsed.type === 'NOTE') message = `Menambahkan catatan ${parsed.noteType}`
            else if (parsed.status) message = `Status diubah menjadi ${parsed.status}`
          }
        } catch {}
        
        return (
          <div key={log.id} className="flex gap-4 items-start border-b border-line pb-4 last:border-0 last:pb-0">
            <div className="w-2 h-2 mt-2.5 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{message}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <p>{new Date(log.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p>Oleh: {log.user?.name || 'Sistem'}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
