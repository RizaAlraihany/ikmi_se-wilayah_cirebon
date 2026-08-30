'use client'

import { useState } from 'react'
import { Bell, Ellipsis, FolderOpen, Send } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog } from '@/components/ui/dialog'
import { Drawer } from '@/components/ui/drawer'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loading-state'
import { Radio } from '@/components/ui/radio'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'

function PreviewSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border py-8 first:border-t-0 first:pt-0 sm:py-10" aria-labelledby={`preview-${title}`}>
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">IKMI Design System</p>
        <h2 id={`preview-${title}`} className="mt-2 font-heading text-2xl font-extrabold text-primary sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function DesignSystemPreview() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showError, setShowError] = useState(true)

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[var(--content-width)]">
        <header className="border-b border-primary pb-8 sm:pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Development preview</p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight text-primary sm:text-5xl">
            Fondasi antarmuka IKMI Cirebon
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            Preview internal untuk memeriksa token, kontrol, status, dan pola mobile sebelum dipakai pada halaman produk.
          </p>
        </header>

        <PreviewSection title="Warna dan tipografi" description="Navy dari identitas IKMI menjadi warna utama; warna semantik hanya menjelaskan status, bukan dekorasi.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Primary', 'bg-primary text-surface'],
              ['Accent', 'bg-accent text-surface'],
              ['Success', 'bg-success-surface text-success-foreground'],
              ['Warning', 'bg-warning-surface text-warning-foreground'],
            ].map(([label, className]) => (
              <div key={label} className={`min-h-24 rounded-xl border border-border p-4 ${className}`}>
                <p className="text-sm font-bold">{label}</p>
                <p className="mt-1 text-xs opacity-80">Semantic token</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <p className="font-heading text-3xl font-extrabold text-primary">Judul informasi yang jelas</p>
            <p className="text-base leading-7 text-text-secondary">Body 16px menjaga keterbacaan konten organisasi di layar mobile dan desktop.</p>
          </div>
        </PreviewSection>

        <PreviewSection title="Aksi dan status" description="Target sentuh minimum 44px, fokus keyboard terlihat, dan status memakai warna semantik yang konsisten.">
          <div className="flex flex-wrap gap-3">
            <Button><Send className="h-4 w-4" aria-hidden="true" />Simpan Program</Button>
            <Button variant="secondary">Batal</Button>
            <Button variant="ghost">Lihat detail</Button>
            <Button variant="danger">Arsipkan</Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="primary">Utama</Badge>
            <StatusBadge status="PUBLISHED" label="Dipublikasikan" />
            <StatusBadge status="PENDING" label="Menunggu review" />
            <StatusBadge status="FAILED" label="Gagal" />
            <StatusBadge status="DRAFT" label="Draf" />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <Alert tone="success" title="Perubahan disimpan">Informasi program telah diperbarui.</Alert>
            <Alert tone="warning" title="Perlu perhatian">Lengkapi tanggal kegiatan sebelum dipublikasikan.</Alert>
          </div>
        </PreviewSection>

        <PreviewSection title="Form" description="Kontrol selalu memakai label yang terlihat, ukuran nyaman disentuh, dan satu kolom pada mobile.">
          <form className="grid max-w-3xl gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <label className="space-y-2 text-sm font-semibold text-primary">
              Nama kegiatan
              <Input placeholder="Contoh: Rapat Evaluasi" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-primary">
              Status
              <Select defaultValue="draft">
                <option value="draft">Draf</option>
                <option value="scheduled">Terjadwal</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-primary sm:col-span-2">
              Catatan
              <Textarea placeholder="Tambahkan informasi penting untuk pengurus." />
            </label>
            <fieldset className="space-y-3 sm:col-span-2">
              <legend className="text-sm font-semibold text-primary">Visibilitas</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-text-secondary">
                <label className="flex min-h-11 items-center gap-2"><Radio name="visibility" defaultChecked />Publik</label>
                <label className="flex min-h-11 items-center gap-2"><Radio name="visibility" />Internal</label>
                <label className="flex min-h-11 items-center gap-2"><Checkbox />Simpan sebagai draf</label>
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <FileUpload label="Dokumen pendukung" description="PDF atau DOCX, maksimal 10 MB." accept=".pdf,.docx" maxSizeBytes={10 * 1024 * 1024} />
            </div>
          </form>
        </PreviewSection>

        <PreviewSection title="Overlay dan menu" description="Dialog menjadi full-screen sheet di mobile bila kontennya panjang; tindakan sekundernya tetap dapat diakses dengan keyboard.">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>Buka dialog</Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Buka drawer</Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>Buka sheet mobile</Button>
            <Dropdown label="Aksi contoh" trigger={<Ellipsis className="h-5 w-5" aria-hidden="true" />}>
              <DropdownItem onSelect={() => undefined}>Ubah data</DropdownItem>
              <DropdownItem onSelect={() => undefined}>Arsipkan</DropdownItem>
            </Dropdown>
          </div>
        </PreviewSection>

        <PreviewSection title="Keadaan antarmuka" description="Loading, empty, dan error menyampaikan kondisi serta langkah berikutnya secara spesifik.">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="border border-border bg-surface"><LoadingState label="Memuat agenda minggu ini…" /></div>
            <div className="border border-border bg-surface"><EmptyState icon={FolderOpen} title="Belum ada Agenda publik" description="Agenda yang belum dijadwalkan tidak tampil di kalender publik." /></div>
            <div className="border border-border bg-surface">
              {showError ? <ErrorState onRetry={() => setShowError(false)} /> : <LoadingState label="Memuat ulang data…" />}
            </div>
          </div>
        </PreviewSection>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Simpan perubahan" description="Pastikan informasi yang ditampilkan kepada publik sudah benar.">
        <Alert tone="info">Perubahan akan tersimpan sebagai draf hingga Anda mempublikasikannya.</Alert>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Batal</Button>
          <Button onClick={() => setDialogOpen(false)}>Simpan</Button>
        </div>
      </Dialog>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Filter Agenda" description="Pola panel samping untuk filter ringkas pada desktop.">
        <div className="space-y-4">
          <label className="space-y-2 text-sm font-semibold text-primary">Bulan<Select defaultValue="agustus"><option value="agustus">Agustus 2026</option></Select></label>
          <Button className="w-full" onClick={() => setDrawerOpen(false)}>Terapkan filter</Button>
        </div>
      </Drawer>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Tambahkan catatan" description="Pola bawah layar untuk tindakan panjang pada mobile.">
        <label className="space-y-2 text-sm font-semibold text-primary">Catatan<Textarea rows={5} placeholder="Tulis catatan untuk tim." /></label>
        <Button className="mt-5 w-full" onClick={() => setSheetOpen(false)}><Bell className="h-4 w-4" aria-hidden="true" />Simpan catatan</Button>
      </Sheet>
    </main>
  )
}
