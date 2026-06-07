'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function LpjViewer({ url, title }: { url: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} aria-label={`Lihat dokumen LPJ ${title}`}>
        <ExternalLink className="h-4 w-4" />
        Lihat
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lpj-preview-title">
      <Card className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px]">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h3 id="lpj-preview-title" className="truncate font-heading text-lg font-bold text-primary">
            Preview LPJ: {title}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Tutup preview LPJ">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-[60vh] flex-1 bg-background p-3">
          <iframe
            src={`${url}#toolbar=0`}
            className="h-full w-full rounded-xl bg-surface ring-1 ring-line"
            title={`Preview LPJ ${title}`}
          />
        </div>
      </Card>
    </div>
  )
}
