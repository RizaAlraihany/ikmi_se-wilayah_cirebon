'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function JsonDiffViewer({ oldData, newData }: { oldData: unknown; newData: unknown }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <Eye className="h-4 w-4" />
        Detail
      </Button>
    )
  }

  const oldString = oldData ? JSON.stringify(oldData, null, 2) : 'null'
  const newString = newData ? JSON.stringify(newData, null, 2) : 'null'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4" role="dialog" aria-modal="true" aria-labelledby="json-diff-title">
      <Card className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h3 id="json-diff-title" className="font-heading text-lg font-bold text-primary">
            Detail Perubahan Data
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Tutup detail perubahan">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-background p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Badge tone="danger">Data Lama</Badge>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-primary p-4 font-mono text-xs text-surface">
                {oldString}
              </pre>
            </div>
            <div className="space-y-2">
              <Badge tone="success">Data Baru</Badge>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-primary p-4 font-mono text-xs text-surface">
                {newString}
              </pre>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
