'use client'

import { useState } from 'react'
import { AlertCircle, Save } from 'lucide-react'
import { updateProgramStatusOverrideAction } from '@/features/programs/actions'
import { programStatusLabel, type ProgramDerivedStatus, type ProgramStatusOverride } from '@/features/programs/domain'
import { Button } from '@/components/ui/button'

type Props = { id: string; derivedStatus: ProgramDerivedStatus; statusOverride: ProgramStatusOverride | null }

export function ProgramStatusEditor({ id, derivedStatus, statusOverride }: Props) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(formData: FormData) {
    setSaving(true)
    const value = String(formData.get('statusOverride') ?? '')
    const result = await updateProgramStatusOverrideAction(id, { statusOverride: value || null })
    setMessage(result.error ?? 'Override status Program diperbarui.')
    setSaving(false)
  }

  return <form action={submit} className="space-y-3">
    {message ? <p role="status" className="flex gap-2 rounded-xl bg-surface-alt p-3 text-sm font-semibold text-primary"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</p> : null}
    <p className="rounded-xl border border-border bg-surface-alt p-3 text-sm text-text-secondary">Status saat ini: <strong className="text-primary">{programStatusLabel(derivedStatus)}</strong>. Status normal dihitung otomatis dari tanggal rencana dalam zona waktu Asia/Jakarta.</p>
    <label className="block space-y-2 text-sm font-semibold text-primary"><span>Override manual</span><select name="statusOverride" defaultValue={statusOverride ?? ''} disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="">Gunakan status otomatis</option><option value="POSTPONED">Ditunda</option><option value="CANCELLED">Dibatalkan</option></select></label>
    <p className="text-xs leading-5 text-text-secondary">Override hanya dipakai untuk Ditunda atau Dibatalkan; mengosongkannya mengembalikan perhitungan otomatis.</p>
    <Button type="submit" size="sm" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Menyimpan…' : 'Simpan override'}</Button>
  </form>
}
