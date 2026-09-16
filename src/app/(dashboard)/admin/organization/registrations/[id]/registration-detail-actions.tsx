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
  return (
    <section className="border border-border bg-surface p-5" aria-labelledby="registration-actions-title">
      <p className="text-xs font-bold uppercase text-accent">Workflow</p>
      <h2 id="registration-actions-title" className="mt-1 border-b border-border pb-3 font-heading text-lg font-extrabold text-primary">Tindakan Pendaftaran</h2>
      {error ? <Alert tone="danger" className="mt-4">{error}</Alert> : null}
      <div className="mt-4 grid gap-3">
        {transitions.map((next) => (
          <Button
            key={next}
            type="button"
            variant={next === 'REJECTED' ? 'danger' : 'secondary'}
            className="w-full justify-between"
            disabled={isUpdating}
            onClick={() => void update(next)}
          >
            <span>{REGISTRATION_STATUS_LABELS[next]}</span>
            <span aria-hidden="true">→</span>
          </Button>
        ))}
        {!transitions.length ? <p className="text-sm leading-6 text-text-secondary">Pendaftaran ini berada pada status akhir dan tidak memiliki tindakan lanjutan.</p> : null}
      </div>
      <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-text-secondary">Setiap perubahan status dicatat dalam Audit Log.</p>
    </section>
  )
}
