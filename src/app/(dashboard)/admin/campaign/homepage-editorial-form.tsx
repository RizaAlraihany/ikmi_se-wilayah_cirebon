'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Save, Trash2 } from 'lucide-react'
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
  const [dragIndex, setDragIndex] = useState<number | null>(null)

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

  async function uploadHeroImages(files?: FileList | null) {
    if (!files?.length) return
    const available = Math.max(0, 12 - content.hero.images.length)
    if (available === 0) {
      setMessage('Maksimal 12 foto hero sudah tercapai.')
      return
    }

    setUploading(true)
    setMessage('')
    const uploadedUrls: string[] = []
    try {
      for (const file of Array.from(files).slice(0, available)) {
        const data = new FormData()
        data.set('file', file)
        const result = await uploadHomepageImageAction(data)
        if (result.error || !result.url) {
          setMessage(result.error || 'Salah satu foto belum dapat diunggah.')
          break
        }
        uploadedUrls.push(result.url)
      }
      if (uploadedUrls.length > 0) {
        setContent((current) => ({ ...current, hero: { ...current.hero, images: [...current.hero.images, ...uploadedUrls] } }))
      }
    } catch {
      setMessage('Foto hero belum dapat diunggah. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  function removeHeroImage(index: number) {
    if (content.hero.images.length <= 1) {
      setMessage('Minimal satu foto hero harus dipertahankan.')
      return
    }
    setContent((current) => ({
      ...current,
      hero: { ...current.hero, images: current.hero.images.filter((_, imageIndex) => imageIndex !== index) },
    }))
  }

  function moveHeroImage(index: number, direction: -1 | 1) {
    setContent((current) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.hero.images.length) return current
      const images = [...current.hero.images]
      ;[images[index], images[targetIndex]] = [images[targetIndex], images[index]]
      return { ...current, hero: { ...current.hero, images } }
    })
  }

  function dropHeroImage(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    setContent((current) => {
      const images = [...current.hero.images]
      const [moved] = images.splice(dragIndex, 1)
      images.splice(targetIndex, 0, moved)
      return { ...current, hero: { ...current.hero, images } }
    })
    setDragIndex(null)
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
          <div><h2 id="homepage-hero-copy" className="font-heading text-lg font-bold text-primary">Hero Beranda</h2><p className="mt-1 text-sm text-muted">Atur copy, foto galeri, dan dua menu floating yang tampil di atas hero publik.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" htmlFor="home-eyebrow"><Input id="home-eyebrow" value={content.hero.eyebrow} onChange={(event) => setContent({ ...content, hero: { ...content.hero, eyebrow: event.target.value } })} /></Field>
            <Field label="Judul" htmlFor="home-title"><Input id="home-title" value={content.hero.title} onChange={(event) => setContent({ ...content, hero: { ...content.hero, title: event.target.value } })} /></Field>
          </div>
          <Field label="Deskripsi" htmlFor="home-subtitle"><Textarea id="home-subtitle" rows={4} value={content.hero.subtitle} onChange={(event) => setContent({ ...content, hero: { ...content.hero, subtitle: event.target.value } })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Menu floating 1" htmlFor="home-floating-1-text"><Input id="home-floating-1-text" value={content.hero.floatingMenu1Text} onChange={(event) => setContent({ ...content, hero: { ...content.hero, floatingMenu1Text: event.target.value } })} /></Field>
            <Field label="Tautan menu floating 1" htmlFor="home-floating-1-link"><Input id="home-floating-1-link" value={content.hero.floatingMenu1Link} onChange={(event) => setContent({ ...content, hero: { ...content.hero, floatingMenu1Link: event.target.value } })} /></Field>
            <Field label="Menu floating 2" htmlFor="home-floating-2-text"><Input id="home-floating-2-text" value={content.hero.floatingMenu2Text} onChange={(event) => setContent({ ...content, hero: { ...content.hero, floatingMenu2Text: event.target.value } })} /></Field>
            <Field label="Tautan menu floating 2" htmlFor="home-floating-2-link"><Input id="home-floating-2-link" value={content.hero.floatingMenu2Link} onChange={(event) => setContent({ ...content, hero: { ...content.hero, floatingMenu2Link: event.target.value } })} /></Field>
          </div>
          <section className="space-y-4 rounded-2xl border border-border bg-surface-alt/35 p-4" aria-labelledby="homepage-hero-images">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 id="homepage-hero-images" className="font-heading text-base font-bold text-primary">Galeri hero</h3><p className="mt-1 text-xs leading-5 text-muted">Foto pertama sampai keempat otomatis membentuk grid mobile. Semua foto dipakai untuk slider tablet dan desktop.</p></div>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary hover:border-accent">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {uploading ? 'Mengunggah...' : 'Tambah foto'}
                <input aria-label="Tambah foto hero" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" className="sr-only" disabled={saving || uploading || content.hero.images.length >= 12} onChange={(event) => { void uploadHeroImages(event.target.files); event.currentTarget.value = '' }} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Urutan foto hero">
              {content.hero.images.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} role="listitem" draggable={!saving && !uploading} onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropHeroImage(index)} className={`group relative overflow-hidden rounded-xl border bg-surface ${dragIndex === index ? 'border-accent opacity-60' : 'border-border'}`}>
                  <div className="relative aspect-square">
                    <Image src={imageUrl} alt={`Foto hero ${index + 1}`} fill sizes="(min-width: 1024px) 180px, 50vw" className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-primary/80 px-2 py-1.5 text-white">
                      <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold"><GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Foto {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded-md p-1 hover:bg-white/15 disabled:opacity-40" onClick={() => moveHeroImage(index, -1)} disabled={index === 0 || saving || uploading} aria-label={`Geser foto ${index + 1} ke kiri`}><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></button>
                        <button type="button" className="rounded-md p-1 hover:bg-white/15 disabled:opacity-40" onClick={() => moveHeroImage(index, 1)} disabled={index === content.hero.images.length - 1 || saving || uploading} aria-label={`Geser foto ${index + 1} ke kanan`}><ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
                        <button type="button" className="rounded-md p-1 hover:bg-danger/30 disabled:opacity-40" onClick={() => removeHeroImage(index)} disabled={saving || uploading} aria-label={`Hapus foto ${index + 1}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
