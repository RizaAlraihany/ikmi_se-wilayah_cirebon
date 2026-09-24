'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateAboutContentAction, uploadAboutImageAction } from '@/features/web-config/actions'
import type { AboutContentInput } from '@/features/web-config/content-contract'

export function AboutContentForm({ initialContent }: { initialContent: AboutContentInput }) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'hero' | 'profile' | null>(null)

  async function uploadImage(target: 'hero' | 'profile', file?: File) {
    if (!file) return
    setUploading(target)
    setMessage('')
    try {
      const data = new FormData()
      data.set('file', file)
      const result = await uploadAboutImageAction(data)
      if (result.error || !result.url) return setMessage(result.error || 'Gambar belum dapat diunggah.')
      setContent((current) => ({ ...current, [target]: { ...current[target], imageUrl: result.url } }))
    } catch {
      setMessage('Gambar belum dapat diunggah. Silakan coba lagi.')
    } finally {
      setUploading(null)
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const result = await updateAboutContentAction(content)
      setMessage(result?.error || 'Konten Tentang berhasil disimpan.')
      if (!result?.error) router.refresh()
    } catch {
      setMessage('Konten Tentang belum dapat disimpan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={save}><Card><CardContent className="space-y-8 p-5 sm:p-6">
    {message ? <p className="border-l-2 border-accent bg-surface-alt px-4 py-3 text-sm font-medium text-primary" role="status">{message}</p> : null}
    <Section title="Hero Tentang">
      <div className="grid gap-4 md:grid-cols-2"><Field label="Judul" htmlFor="about-hero-title"><Input id="about-hero-title" value={content.hero.title} onChange={(event) => setContent({ ...content, hero: { ...content.hero, title: event.target.value } })} /></Field><Field label="Aksen judul" htmlFor="about-hero-accent"><Input id="about-hero-accent" value={content.hero.accent} onChange={(event) => setContent({ ...content, hero: { ...content.hero, accent: event.target.value } })} /></Field></div>
      <Field label="Deskripsi" htmlFor="about-hero-lead"><Textarea id="about-hero-lead" rows={5} value={content.hero.lead} onChange={(event) => setContent({ ...content, hero: { ...content.hero, lead: event.target.value } })} /></Field>
      <Field label="Motto" htmlFor="about-hero-motto"><Input id="about-hero-motto" value={content.hero.motto} onChange={(event) => setContent({ ...content, hero: { ...content.hero, motto: event.target.value } })} /></Field>
      <ImageField id="about-hero-image" label="Gambar hero" value={content.hero.imageUrl} uploading={uploading === 'hero'} onUrl={(value) => setContent({ ...content, hero: { ...content.hero, imageUrl: value } })} onFile={(file) => uploadImage('hero', file)} />
    </Section>
    <Section title="Profil organisasi">
      <Field label="Judul profil" htmlFor="about-profile-title"><Input id="about-profile-title" value={content.profile.title} onChange={(event) => setContent({ ...content, profile: { ...content.profile, title: event.target.value } })} /></Field>
      <Field label="Deskripsi profil" htmlFor="about-profile-description"><Textarea id="about-profile-description" rows={5} value={content.profile.description} onChange={(event) => setContent({ ...content, profile: { ...content.profile, description: event.target.value } })} /></Field>
      <Field label="Kutipan profil" htmlFor="about-profile-quote"><Textarea id="about-profile-quote" rows={3} value={content.profile.quote} onChange={(event) => setContent({ ...content, profile: { ...content.profile, quote: event.target.value } })} /></Field>
      <ImageField id="about-profile-image" label="Gambar profil" value={content.profile.imageUrl} uploading={uploading === 'profile'} onUrl={(value) => setContent({ ...content, profile: { ...content.profile, imageUrl: value } })} onFile={(file) => uploadImage('profile', file)} />
    </Section>
    <Section title="Sejarah organisasi">
      <Field label="Judul sejarah" htmlFor="about-history-title"><Input id="about-history-title" value={content.history.title} onChange={(event) => setContent({ ...content, history: { ...content.history, title: event.target.value } })} /></Field>
      <Field label="Isi sejarah" htmlFor="about-history"><Textarea id="about-history" rows={10} value={content.history.description} onChange={(event) => setContent({ ...content, history: { ...content.history, description: event.target.value } })} /></Field>
      <Field label="Kutipan sejarah" htmlFor="about-history-quote"><Textarea id="about-history-quote" rows={3} value={content.history.quote} onChange={(event) => setContent({ ...content, history: { ...content.history, quote: event.target.value } })} /></Field>
    </Section>
    <Section title="CTA Struktur">
      <Field label="Judul CTA" htmlFor="about-structure-title"><Input id="about-structure-title" value={content.structureCta.title} onChange={(event) => setContent({ ...content, structureCta: { ...content.structureCta, title: event.target.value } })} /></Field>
      <Field label="Deskripsi CTA" htmlFor="about-structure-description"><Textarea id="about-structure-description" rows={4} value={content.structureCta.description} onChange={(event) => setContent({ ...content, structureCta: { ...content.structureCta, description: event.target.value } })} /></Field>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Label CTA" htmlFor="about-structure-label"><Input id="about-structure-label" value={content.structureCta.label} onChange={(event) => setContent({ ...content, structureCta: { ...content.structureCta, label: event.target.value } })} /></Field><Field label="Path CTA" htmlFor="about-structure-href"><Input id="about-structure-href" value={content.structureCta.href} onChange={(event) => setContent({ ...content, structureCta: { ...content.structureCta, href: event.target.value } })} /></Field></div>
    </Section>
    <div className="flex justify-end"><Button type="submit" disabled={saving || uploading !== null}><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Menyimpan...' : 'Simpan konten'}</Button></div>
  </CardContent></Card></form>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><h2 className="font-heading text-lg font-bold text-primary">{title}</h2>{children}</section>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div>
}

function ImageField({ id, label, value, uploading, onUrl, onFile }: { id: string; label: string; value: string; uploading: boolean; onUrl: (value: string) => void; onFile: (file?: File) => void }) {
  return <div className="grid gap-4 md:grid-cols-[1fr_12rem]"><div className="space-y-3"><Field label={`${label} URL`} htmlFor={id}><Input id={id} type="url" value={value} onChange={(event) => onUrl(event.target.value)} /></Field><Input aria-label={`Unggah ${label.toLowerCase()}`} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" disabled={uploading} onChange={(event) => onFile(event.target.files?.[0])} /></div><div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted"><Image src={value} alt={`Preview ${label.toLowerCase()}`} fill sizes="192px" className="object-cover" /></div></div>
}
