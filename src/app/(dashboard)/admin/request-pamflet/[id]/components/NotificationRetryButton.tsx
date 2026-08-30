'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { retryPamfletRequestNotification } from '@/features/request-pamflet/admin-actions'

export function NotificationRetryButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function retry() {
    setIsRetrying(true)
    setMessage(null)
    try {
      const result = await retryPamfletRequestNotification(requestId)
      setFailed(!result.success)
      setMessage(result.success
        ? 'Percobaan notifikasi selesai tanpa delivery gagal.'
        : 'Notifikasi belum terkirim. Periksa konfigurasi penerima atau coba lagi.')
      router.refresh()
    } catch {
      setFailed(true)
      setMessage('Percobaan notifikasi gagal dijalankan.')
    } finally {
      setIsRetrying(false)
    }
  }

  return <div>
    <Button type="button" variant="outline" size="sm" disabled={isRetrying} onClick={retry}>
      <RotateCcw className={isRetrying ? 'h-4 w-4 animate-spin motion-reduce:animate-none' : 'h-4 w-4'} aria-hidden="true" />
      Coba notifikasi
    </Button>
    {message ? <p role={failed ? 'alert' : 'status'} className={failed ? 'mt-2 text-xs text-danger' : 'mt-2 text-xs text-success-foreground'}>{message}</p> : null}
  </div>
}
