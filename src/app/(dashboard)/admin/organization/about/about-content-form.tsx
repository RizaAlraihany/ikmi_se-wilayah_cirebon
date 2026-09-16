'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateAboutContentAction } from '@/features/web-config/actions'
import type { AboutContentInput } from '@/features/web-config/content-contract'

export function AboutContentForm({ initialContent }: { initialContent: AboutContentInput }) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (saving) return
    setSaving(true)
    setMessage('')
    const result = await updateAboutContentAction(content)
    setMessage(result?.error || 'Konten Tentang berhasil disimpan.')
    setSaving(false)
    if (!result?.error) router.refresh()
  }

  return <Card><CardContent className="space-y-6 p-5 sm:p-6">
    {message ? <p className="border-l-2 border-accent bg-surface-alt px-4 py-3 text-sm font-medium text-primary" role="status">{message}</p> : null}
    <div><h2 className="font-heading text-lg font-bold text-primary">Sejarah organisasi</h2><p className="mt-1 text-sm text-muted">Visi, misi kabinet, periode, dan pengurus tetap bersumber dari domain Organisasi.</p></div>
    <Field label="Judul sejarah" htmlFor="about-history-title"><Input id="about-history-title" value={content.historyTitle} onChange={(event) => setContent({ ...content, historyTitle: event.target.value })} /></Field>
    <Field label="Isi sejarah" htmlFor="about-history"><Textarea id="about-history" rows={10} value={content.history} onChange={(event) => setContent({ ...content, history: event.target.value })} /></Field>
    <div className="flex justify-end"><Button type="button" onClick={save} disabled={saving}><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Menyimpan...' : 'Simpan konten'}</Button></div>
  </CardContent></Card>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div>
}
