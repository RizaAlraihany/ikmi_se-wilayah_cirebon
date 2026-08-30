'use client'

import type { RegStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { updateRegistrationStatusAction } from '@/features/registration/actions'
import { REGISTRATION_STATUS_LABELS, REGISTRATION_TRANSITIONS } from '@/features/registration/domain'

export function RegistrationDetailActions({ id, status }: { id: string; status: RegStatus }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  async function update(nextStatus: RegStatus) {
    setIsUpdating(true)
    setError('')
    const result = await updateRegistrationStatusAction(id, nextStatus)
    if (result?.error) setError(result.error)
    else router.refresh()
    setIsUpdating(false)
  }

  const transitions = REGISTRATION_TRANSITIONS[status]
  return <div className="space-y-4 rounded-xl border border-border bg-surface p-5"><h3 className="border-b border-border pb-3 font-heading text-lg font-semibold">Tindakan</h3>{error ? <Alert tone="danger">{error}</Alert> : null}<div className="grid gap-3">{transitions.map((next) => <Button key={next} type="button" variant={next === 'REJECTED' ? 'danger' : 'secondary'} className="w-full justify-start" disabled={isUpdating} onClick={() => void update(next)}>{REGISTRATION_STATUS_LABELS[next]}</Button>)}{!transitions.length ? <p className="text-sm text-text-secondary">Tidak ada transisi berikutnya untuk status ini.</p> : null}</div><p className="text-xs text-muted-foreground">Setiap perubahan status dicatat dalam Audit Log.</p></div>
}
