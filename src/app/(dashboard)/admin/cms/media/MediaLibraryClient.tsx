'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteMediaAction, uploadMediaAction } from '@/features/media/actions'

type MediaAssetItem = {
  id: string
  secureUrl: string
  filename: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  createdAt: Date
  uploader: { name: string }
}

export function MediaLibraryClient({ assets }: { assets: MediaAssetItem[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleUpload(formData: FormData) {
    setMessage('')
    const result = await uploadMediaAction(formData)
    setMessage(result.error || 'Media berhasil diupload.')
    router.refresh()
  }

  async function handleDelete(id: string) {
    setPendingId(id)
    setMessage('')
    const result = await deleteMediaAction(id)
    setPendingId(null)
    setMessage(result.error || 'Media berhasil dihapus.')
    router.refresh()
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setMessage('URL media berhasil disalin.')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          {message ? (
            <div className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-primary ring-1 ring-accent/30" role="status">
              {message}
            </div>
          ) : null}
          <form action={handleUpload} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload media CMS" required />
            <Button type="submit">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload
            </Button>
          </form>
          <p className="text-xs text-muted">Format: JPG, PNG, WebP. Maksimal 2MB.</p>
        </CardContent>
      </Card>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="font-heading text-xl font-bold text-primary">Belum ada media</h2>
            <p className="mt-2 text-sm text-muted">Upload gambar untuk featured image artikel, OG image, dan kebutuhan website publik.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-background">
                <Image src={asset.secureUrl} alt={asset.filename} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <CardContent className="space-y-4 p-4">
                <div>
                  <h2 className="truncate font-heading text-base font-bold text-primary">{asset.filename}</h2>
                  <p className="text-xs text-muted">
                    {asset.mimeType} - {(asset.size / 1024).toFixed(1)} KB
                    {asset.width && asset.height ? ` - ${asset.width}x${asset.height}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted">Uploader: {asset.uploader.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => copyUrl(asset.secureUrl)}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy URL
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(asset.id)} disabled={pendingId === asset.id}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
