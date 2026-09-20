'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateHomepageContentAction, uploadHomepageImageAction } from '@/features/web-config/actions'
import type { HomepageContentInput } from '@/features/web-config/content-contract'

export function HomepageEditorialForm({ initialContent }: { initialContent: HomepageContentInput }) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function uploadProfileImage(file?: File) {
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      const data = new FormData()
      data.set('file', file)
      const result = await uploadHomepageImageAction(data)
      if (result.error || !result.url) return setMessage(result.error || 'Gambar belum dapat diunggah.')
      setContent((current) => ({ ...current, profile: { ...current.profile, imageUrl: result.url } }))
    } catch {
      setMessage('Gambar belum dapat diunggah. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const result = await updateHomepageContentAction(content)
      setMessage(result?.error || 'Konten Beranda berhasil disimpan.')
      if (!result?.error) router.refresh()
    } catch {
      setMessage('Konten Beranda belum dapat disimpan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6">
        {message ? <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-accent/30" role="status">{message}</p> : null}
        <section className="space-y-4" aria-labelledby="homepage-hero-copy">
          <div><h2 id="homepage-hero-copy" className="font-heading text-lg font-bold text-primary">Copy hero</h2><p className="mt-1 text-sm text-muted">Foto dokumentasi tetap dikelola melalui media yang sudah ada.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" htmlFor="home-eyebrow"><Input id="home-eyebrow" value={content.hero.eyebrow} onChange={(event) => setContent({ ...content, hero: { ...content.hero, eyebrow: event.target.value } })} /></Field>
            <Field label="Judul" htmlFor="home-title"><Input id="home-title" value={content.hero.title} onChange={(event) => setContent({ ...content, hero: { ...content.hero, title: event.target.value } })} /></Field>
          </div>
          <Field label="Deskripsi" htmlFor="home-subtitle"><Textarea id="home-subtitle" rows={4} value={content.hero.subtitle} onChange={(event) => setContent({ ...content, hero: { ...content.hero, subtitle: event.target.value } })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label CTA utama" htmlFor="home-primary-label"><Input id="home-primary-label" value={content.hero.primaryCtaLabel} onChange={(event) => setContent({ ...content, hero: { ...content.hero, primaryCtaLabel: event.target.value } })} /></Field>
            <Field label="Path CTA utama" htmlFor="home-primary-href"><Input id="home-primary-href" value={content.hero.primaryCtaHref} onChange={(event) => setContent({ ...content, hero: { ...content.hero, primaryCtaHref: event.target.value } })} /></Field>
            <Field label="Label CTA kedua" htmlFor="home-secondary-label"><Input id="home-secondary-label" value={content.hero.secondaryCtaLabel} onChange={(event) => setContent({ ...content, hero: { ...content.hero, secondaryCtaLabel: event.target.value } })} /></Field>
            <Field label="Path CTA kedua" htmlFor="home-secondary-href"><Input id="home-secondary-href" value={content.hero.secondaryCtaHref} onChange={(event) => setContent({ ...content, hero: { ...content.hero, secondaryCtaHref: event.target.value } })} /></Field>
          </div>
        </section>
        <section className="space-y-4" aria-labelledby="homepage-profile-copy">
          <div><h2 id="homepage-profile-copy" className="font-heading text-lg font-bold text-primary">Teaser profil</h2><p className="mt-1 text-sm text-muted">Struktur, Agenda, dan Publikasi tetap mengambil data domain masing-masing.</p></div>
          <Field label="Judul profil" htmlFor="home-profile-title"><Input id="home-profile-title" value={content.profile.title} onChange={(event) => setContent({ ...content, profile: { ...content.profile, title: event.target.value } })} /></Field>
          <Field label="Deskripsi profil" htmlFor="home-profile-description"><Textarea id="home-profile-description" rows={5} value={content.profile.description} onChange={(event) => setContent({ ...content, profile: { ...content.profile, description: event.target.value } })} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Label CTA profil" htmlFor="home-profile-cta-label"><Input id="home-profile-cta-label" value={content.profile.ctaLabel} onChange={(event) => setContent({ ...content, profile: { ...content.profile, ctaLabel: event.target.value } })} /></Field><Field label="Path CTA profil" htmlFor="home-profile-cta-href"><Input id="home-profile-cta-href" value={content.profile.ctaHref} onChange={(event) => setContent({ ...content, profile: { ...content.profile, ctaHref: event.target.value } })} /></Field></div>
          <div className="grid gap-4 md:grid-cols-[1fr_12rem]"><div className="space-y-3"><Field label="URL gambar profil" htmlFor="home-profile-image"><Input id="home-profile-image" type="url" value={content.profile.imageUrl} onChange={(event) => setContent({ ...content, profile: { ...content.profile, imageUrl: event.target.value } })} /></Field><Field label="Teks alternatif gambar" htmlFor="home-profile-image-alt"><Input id="home-profile-image-alt" value={content.profile.imageAlt} onChange={(event) => setContent({ ...content, profile: { ...content.profile, imageAlt: event.target.value } })} /></Field><Input aria-label="Unggah gambar profil Beranda" type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" disabled={saving || uploading} onChange={(event) => void uploadProfileImage(event.target.files?.[0])} /></div><div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted"><Image src={content.profile.imageUrl} alt={`Preview ${content.profile.imageAlt}`} fill sizes="192px" className="object-cover" /></div></div>
        </section>
        <section className="space-y-4" aria-labelledby="homepage-cta-copy">
          <h2 id="homepage-cta-copy" className="font-heading text-lg font-bold text-primary">CTA Gabung</h2>
          <Field label="Judul CTA" htmlFor="home-cta-title"><Input id="home-cta-title" value={content.cta.title} onChange={(event) => setContent({ ...content, cta: { ...content.cta, title: event.target.value } })} /></Field>
          <Field label="Deskripsi CTA" htmlFor="home-cta-description"><Textarea id="home-cta-description" rows={5} value={content.cta.description} onChange={(event) => setContent({ ...content, cta: { ...content.cta, description: event.target.value } })} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Label CTA" htmlFor="home-cta-label"><Input id="home-cta-label" value={content.cta.label} onChange={(event) => setContent({ ...content, cta: { ...content.cta, label: event.target.value } })} /></Field><Field label="Path CTA" htmlFor="home-cta-href"><Input id="home-cta-href" value={content.cta.href} onChange={(event) => setContent({ ...content, cta: { ...content.cta, href: event.target.value } })} /></Field></div>
        </section>
        <div className="flex justify-end"><Button type="button" onClick={save} disabled={saving || uploading}><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Menyimpan...' : 'Simpan konten'}</Button></div>
      </CardContent>
    </Card>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div>
}
