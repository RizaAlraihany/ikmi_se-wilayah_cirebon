'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncementAction } from '@/features/announcements/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type FormState = { success?: boolean; error?: string } | null

async function createDraftAction(_: FormState, formData: FormData): Promise<FormState> {
  const input = {
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
  }
  return createAnnouncementAction(input, false)
}

async function createAndPublishAction(_: FormState, formData: FormData): Promise<FormState> {
  const input = {
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? ''),
  }
  return createAnnouncementAction(input, true)
}

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [stateDraft, formDraftAction, pendingDraft] = useActionState(createDraftAction, null)
  const [statePublish, formPublishAction, pendingPublish] = useActionState(createAndPublishAction, null)

  if (stateDraft?.success || statePublish?.success) {
    router.push('/admin/announcements')
  }

  const error = stateDraft?.error ?? statePublish?.error
  const pending = pendingDraft || pendingPublish

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Buat Pengumuman</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tulis pengumuman dan pilih untuk menyimpan sebagai draft atau langsung publish dan blast ke WhatsApp.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {error ? (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          ) : null}

          <form action={formDraftAction} className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-primary">
                Judul Pengumuman <span className="text-danger">*</span>
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Contoh: Rapat Koordinasi BPH IKMI"
              />
            </div>

            <div>
              <label htmlFor="content" className="mb-1.5 block text-sm font-semibold text-primary">
                Isi Pengumuman <span className="text-danger">*</span>
              </label>
              <Textarea
                id="content"
                name="content"
                required
                rows={8}
                placeholder="Tulis isi pengumuman di sini..."
              />
              <p className="mt-1.5 text-xs text-text-muted">
                Teks ini dapat dikirim via WhatsApp ke seluruh anggota aktif yang memiliki nomor WA terdaftar.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" type="button" onClick={() => router.back()} disabled={pending}>
                Batal
              </Button>
              <Button type="submit" variant="secondary" disabled={pending} formAction={formDraftAction}>
                {pendingDraft ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
              <Button type="submit" disabled={pending} formAction={formPublishAction}>
                {pendingPublish ? 'Mengirim...' : 'Publish & Blast WA'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
