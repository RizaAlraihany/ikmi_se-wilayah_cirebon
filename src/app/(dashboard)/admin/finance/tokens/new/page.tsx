'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { generateLpjTokenAction } from '@/features/lpj-token/actions'
import { GenerateLpjTokenInput } from '@/features/lpj-token/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type FormState = { success?: boolean; error?: string; token?: string } | null

async function formAction(_: FormState, formData: FormData): Promise<FormState> {
  const input: GenerateLpjTokenInput = {
    activityName: String(formData.get('activityName') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    expiredAt: new Date(String(formData.get('expiredAt') ?? '')),
  }
  return generateLpjTokenAction(input)
}

export default function NewLpjTokenPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(formAction, null)

  const defaultExpiry = new Date()
  defaultExpiry.setDate(defaultExpiry.getDate() + 7)
  const defaultExpiryStr = defaultExpiry.toISOString().slice(0, 16)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Generate LPJ Token</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Token ini akan dibagikan ke pengurus yang perlu submit LPJ. Token hanya bisa digunakan satu kali.
        </p>
      </div>

      {state?.success && state.token ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
              Token berhasil dibuat.
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">Token:</p>
              <div className="break-all rounded-xl bg-surface-alt p-4 font-mono text-sm text-primary">
                {state.token}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Bagikan token ini ke pengurus yang bersangkutan via WhatsApp atau saluran komunikasi organisasi.
                Token hanya bisa digunakan satu kali.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => router.push('/admin/finance/tokens')}>Kembali ke Daftar Token</Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Generate Token Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {state?.error ? (
              <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                {state.error}
              </div>
            ) : null}

            <form action={action} className="space-y-4">
              <div>
                <label htmlFor="activityName" className="mb-1.5 block text-sm font-semibold text-primary">
                  Nama Kegiatan <span className="text-danger">*</span>
                </label>
                <Input
                  id="activityName"
                  name="activityName"
                  type="text"
                  required
                  placeholder="Contoh: Seminar Nasional 2025"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-primary">
                  Deskripsi (opsional)
                </label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Keterangan tambahan untuk token ini..."
                />
              </div>

              <div>
                <label htmlFor="expiredAt" className="mb-1.5 block text-sm font-semibold text-primary">
                  Tanggal Kedaluwarsa <span className="text-danger">*</span>
                </label>
                <Input
                  id="expiredAt"
                  name="expiredAt"
                  type="datetime-local"
                  required
                  defaultValue={defaultExpiryStr}
                />
                <p className="mt-1.5 text-xs text-text-muted">Disarankan: 3-7 hari dari sekarang.</p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
                  Batal
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Membuat Token...' : 'Generate Token'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
