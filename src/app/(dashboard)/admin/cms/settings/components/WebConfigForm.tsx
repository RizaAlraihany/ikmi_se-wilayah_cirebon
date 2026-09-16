'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updateContactInfoAction } from '@/features/web-config/actions'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { normalizePublicContactInfo, type PublicContactInfo } from '@/features/web-config/contact-contract'

type ConfigValues = { contact_info?: unknown }

function contactWithFallback(value: unknown): PublicContactInfo {
  const fallback = normalizePublicContactInfo(defaultWebConfig.contact_info)
  return value && typeof value === 'object' && !Array.isArray(value)
    ? normalizePublicContactInfo(value)
    : fallback
}

export function WebConfigForm({ configs }: { configs: ConfigValues }) {
  const router = useRouter()
  const [contact, setContact] = useState(() => contactWithFallback(configs.contact_info))
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveContact() {
    setSaving(true)
    setMessage('')
    const result = await updateContactInfoAction(contact)
    setMessage(result?.error || 'Kontak publik berhasil disimpan.')
    setSaving(false)
    if (!result?.error) router.refresh()
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {message ? <div className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-accent/30">{message}</div> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary">Informasi kontak</h2>
            <p className="mt-1 text-sm text-muted">Kosongkan bidang opsional bila belum digunakan.</p>
          </div>
          <Button type="button" size="sm" onClick={saveContact} disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" htmlFor="contact-email"><Input id="contact-email" type="email" value={contact.email ?? ''} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></Field>
          <Field label="WhatsApp" htmlFor="contact-whatsapp"><Input id="contact-whatsapp" value={contact.whatsapp ?? ''} onChange={(event) => setContact({ ...contact, whatsapp: event.target.value })} /></Field>
          <Field label="Alamat" htmlFor="contact-address"><Input id="contact-address" value={contact.address ?? ''} onChange={(event) => setContact({ ...contact, address: event.target.value })} /></Field>
          <Field label="Instagram" htmlFor="contact-instagram"><Input id="contact-instagram" type="url" value={contact.instagram ?? ''} onChange={(event) => setContact({ ...contact, instagram: event.target.value })} /></Field>
          <Field label="TikTok" htmlFor="contact-tiktok"><Input id="contact-tiktok" type="url" value={contact.tiktok ?? ''} onChange={(event) => setContact({ ...contact, tiktok: event.target.value })} /></Field>
          <Field label="YouTube" htmlFor="contact-youtube"><Input id="contact-youtube" type="url" value={contact.youtube ?? ''} onChange={(event) => setContact({ ...contact, youtube: event.target.value })} /></Field>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div>
}
