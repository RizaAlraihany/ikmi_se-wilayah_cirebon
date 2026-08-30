'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createDocumentArchiveAction } from '@/features/document-archives/actions'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

type RelationOption = { id: string; name: string }

export function DocumentArchiveForm({ periods, units, programs }: { periods: RelationOption[]; units: RelationOption[]; programs: RelationOption[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    const result = await createDocumentArchiveAction(formData)
    if (!result.success) {
      setError(result.message || 'Dokumen tidak dapat disimpan.')
    } else {
      setIsOpen(false)
      router.refresh()
    }
    setIsSubmitting(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" />Tambah Dokumen</Button>
      <Sheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Arsip Dokumen Baru"
        description="Dokumen disimpan privat; file hanya dibuka melalui akses dashboard yang sah."
      >
            <form action={handleSubmit} className="space-y-5">
                {error ? <div role="alert" className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">{error}</div> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Judul Dokumen" htmlFor="title" className="sm:col-span-2"><Input id="title" name="title" required minLength={3} maxLength={160} disabled={isSubmitting} placeholder="Contoh: Notulen Rapat Kerja" /></Field>
                  <Field label="Kategori" htmlFor="category"><ListboxSelect id="category" name="category" defaultValue={documentArchiveCategories[0]} options={documentArchiveCategories.map((category) => ({ value: category, label: category }))} disabled={isSubmitting} /></Field>
                  <Field label="Tanggal Arsip" htmlFor="archivedAt"><Input id="archivedAt" name="archivedAt" type="date" required disabled={isSubmitting} /></Field>
                  <Field label="Unit Organisasi" htmlFor="organizationalUnitId"><RelationSelect id="organizationalUnitId" name="organizationalUnitId" options={units} disabled={isSubmitting} emptyLabel="Tidak ditautkan" /></Field>
                  <Field label="Periode" htmlFor="periodId"><RelationSelect id="periodId" name="periodId" options={periods} disabled={isSubmitting} emptyLabel="Tidak ditautkan" /></Field>
                  <Field label="Program" htmlFor="programId" className="sm:col-span-2"><RelationSelect id="programId" name="programId" options={programs} disabled={isSubmitting} emptyLabel="Tidak ditautkan" /></Field>
                  <Field label="Deskripsi" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" maxLength={1000} disabled={isSubmitting} placeholder="Keterangan singkat dokumen..." rows={4} /></Field>
                  <Field label="Dokumen" htmlFor="file" className="sm:col-span-2">
                    <Input id="file" name="file" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required disabled={isSubmitting} />
                    <p className="mt-2 text-xs text-text-secondary">PDF atau DOCX, maksimal 10 MB. Akses dokumen bersifat internal secara default.</p>
                  </Field>
                </div>
                <input type="hidden" name="visibility" value="INTERNAL" />
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Batal</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Dokumen'}</Button>
                </div>
            </form>
      </Sheet>
    </>
  )
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-2 ${className ?? ''}`}><label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>{children}</div>
}

function RelationSelect({ id, name, options, emptyLabel, disabled }: { id: string; name: string; options: RelationOption[]; emptyLabel: string; disabled: boolean }) {
  return <Select id={id} name={name} disabled={disabled}><option value="">{emptyLabel}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select>
}
