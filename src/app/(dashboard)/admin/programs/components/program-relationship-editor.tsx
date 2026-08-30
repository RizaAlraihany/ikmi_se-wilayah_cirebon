'use client'

import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { linkProgramRelationshipAction } from '@/features/programs/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ProgramOption = { id: string; name: string }

export function ProgramRelationshipEditor({ sourceProgramId, programs }: { sourceProgramId: string; programs: ProgramOption[] }) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(formData: FormData) {
    setSaving(true)
    const result = await linkProgramRelationshipAction(sourceProgramId, {
      targetProgramId: String(formData.get('targetProgramId') ?? ''),
      relationshipType: String(formData.get('relationshipType') ?? ''),
      note: String(formData.get('note') ?? ''),
    })
    setMessage(result.error ?? 'Hubungan program disimpan.')
    setSaving(false)
  }

  return <form action={submit} className="grid gap-3 rounded-xl border border-border bg-surface-alt p-4 md:grid-cols-[1fr_11rem]">
    <label className="space-y-2 text-sm font-semibold text-primary"><span>Program terkait</span><select name="targetProgramId" required disabled={saving || programs.length === 0} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="">Pilih program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
    <label className="space-y-2 text-sm font-semibold text-primary"><span>Jenis hubungan</span><select name="relationshipType" defaultValue="RELATED_TO" disabled={saving} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-primary"><option value="RELATED_TO">Terkait</option><option value="PART_OF">Bagian dari</option><option value="SCHEDULED_WITH">Dijadwalkan bersama</option><option value="DEPENDS_ON">Bergantung pada</option></select></label>
    <label className="space-y-2 text-sm font-semibold text-primary md:col-span-2"><span>Catatan hubungan</span><Input name="note" placeholder="Opsional" disabled={saving} /></label>
    <div className="md:col-span-2"><Button type="submit" size="sm" disabled={saving || programs.length === 0}><Link2 className="mr-2 h-4 w-4" />{saving ? 'Menyimpan…' : 'Hubungkan program'}</Button>{message ? <p role="status" className="mt-2 text-sm font-medium text-text-secondary">{message}</p> : null}{programs.length === 0 ? <p className="mt-2 text-sm text-text-secondary">Tidak ada program lain dalam cakupan akses Anda.</p> : null}</div>
  </form>
}
