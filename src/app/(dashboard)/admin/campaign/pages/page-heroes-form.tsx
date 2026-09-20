'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePageHeroesContentAction, uploadKomdigiWebImageAction } from '@/features/web-config/actions'
import type { PageHeroKey, PageHeroesContentInput } from '@/features/web-config/content-contract'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const pageHeroLabels: Record<PageHeroKey, string> = {
  kegiatan: 'Kegiatan / Agenda',
  publikasi: 'Publikasi',
  'kirim-tulisan': 'Kirim Tulisan',
  gabung: 'Gabung Bersama',
  kontak: 'Kontak Resmi',
}

export function PageHeroesForm({ initialContent }: { initialContent: PageHeroesContentInput }) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<PageHeroKey | null>(null)
  const [message, setMessage] = useState('')

  function update(key: PageHeroKey, field: keyof PageHeroesContentInput[PageHeroKey], value: string) {
    setContent((current) => ({ ...current, [key]: { ...current[key], [field]: value } }))
  }

  async function uploadImage(key: PageHeroKey, file?: File) {
    if (!file) return
    setUploading(key)
    setMessage('')
    try {
      const data = new FormData()
      data.set('file', file)
      const result = await uploadKomdigiWebImageAction(data)
      if (result.error || !result.url) {
        setMessage(result.error || 'Gambar belum dapat diunggah.')
        return
      }
      update(key, 'imageUrl', result.url)
    } catch {
      setMessage('Gambar belum dapat diunggah. Silakan coba lagi.')
    } finally {
      setUploading(null)
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const result = await updatePageHeroesContentAction(content)
      setMessage(result.error || 'Hero halaman tersimpan.')
      if (!result.error) router.refresh()
    } catch {
      setMessage('Hero halaman belum dapat disimpan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {(Object.keys(pageHeroLabels) as PageHeroKey[]).map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg">{pageHeroLabels[key]}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input aria-label={`Judul hero ${pageHeroLabels[key]}`} value={content[key].title} onChange={(event) => update(key, 'title', event.target.value)} maxLength={160} required />
              <Textarea aria-label={`Deskripsi hero ${pageHeroLabels[key]}`} value={content[key].lead} onChange={(event) => update(key, 'lead', event.target.value)} maxLength={900} rows={3} required />
              <Input aria-label={`URL gambar hero ${pageHeroLabels[key]}`} value={content[key].imageUrl} onChange={(event) => update(key, 'imageUrl', event.target.value)} maxLength={2048} type="url" required />
              <Input aria-label={`Unggah gambar hero ${pageHeroLabels[key]}`} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif" disabled={saving || uploading === key} onChange={(event) => void uploadImage(key, event.target.files?.[0])} />
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <Image src={content[key].imageUrl} alt={`Preview hero ${pageHeroLabels[key]}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || uploading !== null}>Simpan semua hero</Button>
        {message ? <p role="status" className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  )
}
