'use client'

import { useState } from 'react'
import { FileText, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitKaryaTulisRevisionAction } from '@/features/kirim-tulisan/actions'

export function KirimTulisanRevisionForm({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return setError('Pilih file DOCX atau PDF terlebih dahulu.')
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.set('file', file)
    formData.set('bot_field', '')
    const result = await submitKaryaTulisRevisionAction(token, formData)
    setIsSubmitting(false)
    if (result.success) setSuccess(true)
    else setError(result.error ?? 'Revisi gagal dikirim.')
  }

  if (success) return <section className="mt-6 rounded-xl border border-success/30 bg-success/10 p-5 text-sm text-success-foreground"><h2 className="font-semibold">Revisi berhasil dikirim</h2><p className="mt-1">File baru masuk kembali ke antrean review redaksi.</p></section>

  return <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
    {error ? <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
    <label htmlFor="revision-file" className="block text-sm font-semibold text-primary">File revisi</label>
    <Input id="revision-file" type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={isSubmitting} />
    <p className="text-xs text-muted-foreground">DOCX atau PDF, maksimal 10 MB. File asli tetap tersimpan sebagai versi sebelumnya.</p>
    {file ? <p className="flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4" />{file.name}</p> : null}
    <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
    <Button type="submit" className="w-full" disabled={isSubmitting || !file}><UploadCloud className="h-4 w-4" />{isSubmitting ? 'Mengunggah revisi...' : 'Kirim revisi'}</Button>
  </form>
}
