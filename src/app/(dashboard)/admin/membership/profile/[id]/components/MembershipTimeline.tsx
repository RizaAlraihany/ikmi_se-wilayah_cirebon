'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

type TimelineLog = {
  id: string
  action: string
  newData: string | null
  createdAt: Date | string
  user?: { name: string | null } | null
}

export function MembershipTimeline({ logs }: { logs: TimelineLog[] }) {
  const [q, setQ] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5

  const filteredLogs = logs.filter(log => {
    let message = `Action: ${log.action}`
    try {
      if (log.newData) {
        const parsed = JSON.parse(log.newData)
        if (parsed.message) message = parsed.message
      }
    } catch {}

    const searchString = `${message} ${log.user?.name || ''}`.toLowerCase()
    return searchString.includes(q.toLowerCase())
  })

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
  })

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage)
  const paginatedLogs = sortedLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Cari riwayat..." 
            value={q} 
            onChange={e => { setQ(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
        >
          {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronUp className="w-4 h-4 mr-2" />}
          {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
        </Button>
      </div>

      {paginatedLogs.length > 0 ? (
        <div className="space-y-4">
          {paginatedLogs.map((log) => {
            let message = `Action: ${log.action}`
            try {
              if (log.newData) {
                const parsed = JSON.parse(log.newData)
                if (parsed.message) message = parsed.message
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
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat aktivitas yang sesuai.</p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4 border-t border-line">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </Button>
          <span className="text-sm flex items-center">
            {page} / {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
