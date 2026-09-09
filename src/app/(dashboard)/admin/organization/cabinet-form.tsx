'use client'

import { useState } from 'react'
import { updateCabinetAction } from '@/features/organization/actions'
import type { CabinetInput } from '@/features/organization/cabinet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function CabinetForm({ periodId, cabinet }: { periodId: string; cabinet?: CabinetInput | null }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save(form: FormData) {
    setSaving(true)
    try {
      const text = (key: string) => String(form.get(key) || '')
      const result = await updateCabinetAction(periodId, { tagline: text('tagline'), description: text('description'), vision: text('vision'), missions: text('missions').split('\n').map((line) => line.trim()).filter(Boolean), logoUrl: text('logoUrl') })
      setMessage(result.error || 'Profil kabinet tersimpan.')
    } catch {
      setMessage('Profil kabinet belum dapat disimpan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }
  return <form action={save} className="mt-4 grid gap-3 border-t border-border pt-4" aria-label="Profil kabinet">
    <Input name="tagline" aria-label="Tagline kabinet" placeholder="Tagline kabinet" defaultValue={cabinet?.tagline} maxLength={200} />
    <Textarea name="description" aria-label="Deskripsi kabinet" placeholder="Deskripsi kabinet" defaultValue={cabinet?.description} maxLength={2000} />
    <Textarea name="vision" aria-label="Visi kabinet" placeholder="Visi kabinet" required defaultValue={cabinet?.vision} maxLength={2000} />
    <Textarea name="missions" aria-label="Misi kabinet, satu per baris" placeholder="Misi kabinet, satu per baris" required defaultValue={cabinet?.missions.join('\n')} rows={5} />
    <Input name="logoUrl" aria-label="URL logo kabinet" placeholder="URL gambar logo kabinet" defaultValue={cabinet?.logoUrl} maxLength={2048} />
    <Button type="submit" disabled={saving}>Simpan profil kabinet</Button>
    {message ? <p role="status">{message}</p> : null}
  </form>
}
