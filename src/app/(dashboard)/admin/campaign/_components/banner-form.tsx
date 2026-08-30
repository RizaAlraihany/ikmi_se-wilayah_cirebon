'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { archiveHomepageBanner, createHomepageBanner, updateHomepageBanner } from '@/features/homepage-banner/actions'
import { formatJakartaCampaignDatetime } from '@/features/homepage-banner/domain'

type BannerFormData = {
  id: string
  programId: string | null
  internalTitle: string
  phase: 'BEFORE' | 'PRA' | 'AFTER' | 'GENERAL'
  headline: string
  supportingText: string | null
  desktopImage: string | null
  mobileImage: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  startAt: Date | null
  endAt: Date | null
  priority: number
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'
}

type ProgramOption = { id: string; name: string }

interface Props {
  banner?: BannerFormData
  programs: ProgramOption[]
}

export function BannerForm({ banner, programs }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = banner
      ? await updateHomepageBanner(banner.id, formData)
      : await createHomepageBanner(formData)

    if (result.success) {
      router.push('/admin/campaign')
      router.refresh()
      return
    }
    setError(result.error || 'Banner belum dapat disimpan.')
    setLoading(false)
  }

  async function onArchive() {
    if (!banner) return
    setError(null)
    setLoading(true)
    const result = await archiveHomepageBanner(banner.id)
    if (result.success) {
      router.push('/admin/campaign')
      router.refresh()
      return
    }
    setArchiveOpen(false)
    setError(result.error || 'Banner belum dapat diarsipkan.')
    setLoading(false)
  }

  return (
    <>
      <form onSubmit={onSubmit} aria-busy={loading} className="mx-auto max-w-5xl space-y-10">
        {error ? <Alert tone="danger" title="Perubahan belum tersimpan">{error}</Alert> : null}

        <section className="border-t border-border pt-6" aria-labelledby="campaign-content-heading">
          <h2 id="campaign-content-heading" className="font-heading text-xl font-extrabold text-primary">Konten campaign</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">Judul internal hanya terlihat oleh admin. Headline dan teks pendukung tampil di homepage.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Judul internal" htmlFor="internalTitle" required>
              <Input id="internalTitle" name="internalTitle" required minLength={3} maxLength={120} defaultValue={banner?.internalTitle} placeholder="Contoh: Pra-PRABUMI Agustus" />
            </Field>
            <Field label="Fase campaign" htmlFor="phase" required>
              <Select id="phase" name="phase" required defaultValue={banner?.phase || 'GENERAL'}>
                <option value="GENERAL">Umum</option>
                <option value="BEFORE">Sebelum kegiatan</option>
                <option value="PRA">Pra-kegiatan</option>
                <option value="AFTER">Setelah kegiatan</option>
              </Select>
            </Field>
            <Field label="Headline" htmlFor="headline" required className="md:col-span-2">
              <Input id="headline" name="headline" required minLength={3} maxLength={160} defaultValue={banner?.headline} placeholder="Pesan utama yang singkat dan jelas" />
            </Field>
            <Field label="Teks pendukung" htmlFor="supportingText" description="Opsional, maksimal 320 karakter." className="md:col-span-2">
              <Textarea id="supportingText" name="supportingText" maxLength={320} defaultValue={banner?.supportingText || ''} rows={4} />
            </Field>
          </div>
        </section>

        <section className="border-t border-border pt-6" aria-labelledby="campaign-image-heading">
          <h2 id="campaign-image-heading" className="font-heading text-xl font-extrabold text-primary">Gambar responsif</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">Gunakan URL HTTPS Cloudinary. Gambar mobile terpisah mencegah crop utama terpotong pada layar 360–430px.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Gambar desktop" htmlFor="desktopImage" required description="Disarankan rasio lebar 16:8.">
              <Input id="desktopImage" name="desktopImage" type="text" inputMode="url" required maxLength={2048} defaultValue={banner?.desktopImage || ''} placeholder="https://res.cloudinary.com/..." />
            </Field>
            <Field label="Gambar mobile" htmlFor="mobileImage" required description="Disarankan rasio potret 4:5.">
              <Input id="mobileImage" name="mobileImage" type="text" inputMode="url" required maxLength={2048} defaultValue={banner?.mobileImage || ''} placeholder="https://res.cloudinary.com/..." />
            </Field>
          </div>
        </section>

        <section className="border-t border-border pt-6" aria-labelledby="campaign-action-heading">
          <h2 id="campaign-action-heading" className="font-heading text-xl font-extrabold text-primary">Tautan dan Program</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">CTA bersifat opsional, tetapi label dan URL harus diisi bersama.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Label CTA" htmlFor="ctaLabel">
              <Input id="ctaLabel" name="ctaLabel" maxLength={48} defaultValue={banner?.ctaLabel || ''} placeholder="Contoh: Lihat Program" />
            </Field>
            <Field label="URL CTA" htmlFor="ctaUrl" description="Path internal seperti /program/prabumi atau URL HTTPS.">
              <Input id="ctaUrl" name="ctaUrl" type="text" inputMode="url" maxLength={2048} defaultValue={banner?.ctaUrl || ''} placeholder="/program/nama-program" />
            </Field>
            <Field label="Program terkait" htmlFor="programId" description="Hanya Program PUBLIC dengan campaign diaktifkan yang dapat dipilih." className="md:col-span-2">
              <Select id="programId" name="programId" defaultValue={banner?.programId || ''}>
                <option value="">Tanpa Program terkait</option>
                {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
              </Select>
              {programs.length === 0 ? <p className="text-sm text-text-muted">Belum ada Program publik yang mengaktifkan campaign.</p> : null}
            </Field>
          </div>
        </section>

        <section className="border-t border-border pt-6" aria-labelledby="campaign-schedule-heading">
          <h2 id="campaign-schedule-heading" className="font-heading text-xl font-extrabold text-primary">Publikasi dan jadwal</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">Seluruh waktu dibaca sebagai Asia/Jakarta. Status Dijeda selalu mengeluarkan banner dari homepage.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Status" htmlFor="status" required>
              <Select id="status" name="status" required defaultValue={banner?.status === 'ARCHIVED' ? 'DRAFT' : banner?.status || 'DRAFT'}>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Terjadwal</option>
                <option value="PUBLISHED">Dipublikasikan</option>
                <option value="PAUSED">Dijeda</option>
              </Select>
            </Field>
            <Field label="Prioritas" htmlFor="priority" description="-100 sampai 100. Angka lebih tinggi tampil lebih dahulu.">
              <Input id="priority" name="priority" type="number" min={-100} max={100} defaultValue={banner?.priority ?? 0} />
            </Field>
            <Field label="Mulai tampil" htmlFor="startAt" description="Wajib untuk status Terjadwal.">
              <Input id="startAt" name="startAt" type="datetime-local" defaultValue={formatJakartaCampaignDatetime(banner?.startAt)} />
            </Field>
            <Field label="Selesai tampil" htmlFor="endAt" description="Opsional; harus setelah waktu mulai.">
              <Input id="endAt" name="endAt" type="datetime-local" defaultValue={formatJakartaCampaignDatetime(banner?.endAt)} />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>{banner && banner.status !== 'ARCHIVED' ? <Button type="button" variant="danger" onClick={() => setArchiveOpen(true)} disabled={loading}>Arsipkan Banner</Button> : null}</div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan Banner'}</Button>
          </div>
        </div>
      </form>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen} title="Arsipkan banner?" description="Banner akan dihapus dari daftar aktif dan tidak lagi tampil di homepage.">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setArchiveOpen(false)} disabled={loading}>Batal</Button>
          <Button variant="danger" onClick={onArchive} disabled={loading}>{loading ? 'Mengarsipkan…' : 'Ya, arsipkan'}</Button>
        </div>
      </Dialog>
    </>
  )
}
