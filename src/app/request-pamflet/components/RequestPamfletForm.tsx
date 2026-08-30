'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type FieldPath, useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { validateImageOrDocument } from '@/core/storage/file-validator'
import { submitRequestPamfletAction } from '@/features/request-pamflet/actions'
import {
  PAMFLET_REQUEST_TYPES,
  requestPamfletSchema,
  type RequestPamfletData,
  type RequestPamfletFormInput,
} from '@/features/request-pamflet/schemas'

interface RequestPamfletFormProps {
  programs: { id: string; name: string }[]
  agendas: { id: string; name: string }[]
}

function fieldDescriptionId(id: string, error: unknown, hasDescription = false) {
  if (error) return `${id}-error`
  return hasDescription ? `${id}-description` : undefined
}

export function RequestPamfletForm({ programs, agendas }: RequestPamfletFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RequestPamfletFormInput, unknown, RequestPamfletData>({
    resolver: zodResolver(requestPamfletSchema),
    defaultValues: {
      relatedEntity: '',
      requestType: undefined,
      eventStartTime: '',
      eventEndTime: '',
      referenceLink: '',
      bot_field: '',
    },
  })

  async function onSubmit(data: RequestPamfletData) {
    setIsSubmitting(true)
    setSubmitError(null)
    clearErrors()

    try {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== '') formData.set(key, value)
      }
      if (attachment) formData.set('attachment', attachment)

      const result = await submitRequestPamfletAction(formData)
      if (result.success) {
        router.push(`/request-pamflet/success?req=${encodeURIComponent(result.requestNumber)}`)
        return
      }

      setSubmitError(result.error)
      const fieldEntries = Object.entries(result.fieldErrors ?? {})
      fieldEntries.forEach(([name, messages], index) => {
        const message = messages?.[0]
        if (message) {
          setError(name as FieldPath<RequestPamfletFormInput>, { type: 'server', message }, { shouldFocus: index === 0 })
        }
      })
    } catch {
      setSubmitError('Koneksi terputus. Periksa jaringan Anda lalu kirim kembali.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function validateAttachment(files: File[]) {
    const file = files[0]
    if (!file) return null
    const result = validateImageOrDocument(file)
    return result.valid ? null : result.error ?? 'Lampiran tidak valid.'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="space-y-9">
      {submitError ? <Alert tone="danger" title="Request belum terkirim">{submitError}</Alert> : null}

      <section aria-labelledby="requester-heading">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">01 · Identitas</p>
          <h2 id="requester-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Data pengaju</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">Gunakan kontak pengurus yang dapat dihubungi selama proses desain.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama pengaju" htmlFor="requester-name" required error={errors.requesterName?.message}>
            <Input id="requester-name" autoComplete="name" maxLength={120} required aria-invalid={Boolean(errors.requesterName)} aria-describedby={fieldDescriptionId('requester-name', errors.requesterName)} {...register('requesterName')} />
          </Field>
          <Field label="Unit / Departemen" htmlFor="requester-unit" required error={errors.requesterUnit?.message}>
            <Input id="requester-unit" autoComplete="organization" maxLength={120} required placeholder="Contoh: Kaderisasi" aria-invalid={Boolean(errors.requesterUnit)} aria-describedby={fieldDescriptionId('requester-unit', errors.requesterUnit)} {...register('requesterUnit')} />
          </Field>
          <Field label="Nomor WhatsApp" htmlFor="requester-whatsapp" required error={errors.requesterWhatsapp?.message} description="Boleh diawali 08 atau +62; nomor disimpan dalam format Indonesia.">
            <Input id="requester-whatsapp" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} required placeholder="0812 3456 7890" aria-invalid={Boolean(errors.requesterWhatsapp)} aria-describedby={fieldDescriptionId('requester-whatsapp', errors.requesterWhatsapp, true)} {...register('requesterWhatsapp')} />
          </Field>
          <Field label="Program / Agenda terkait" htmlFor="related-entity" error={errors.relatedEntity?.message} description="Opsional. Hanya data yang memang dipublikasikan yang tersedia.">
            <Select id="related-entity" aria-invalid={Boolean(errors.relatedEntity)} aria-describedby={fieldDescriptionId('related-entity', errors.relatedEntity, true)} {...register('relatedEntity')}>
              <option value="">Tidak terkait / Lainnya</option>
              {programs.length ? <optgroup label="Program">{programs.map((program) => <option key={program.id} value={`program:${program.id}`}>{program.name}</option>)}</optgroup> : null}
              {agendas.length ? <optgroup label="Agenda">{agendas.map((agenda) => <option key={agenda.id} value={`agenda:${agenda.id}`}>{agenda.name}</option>)}</optgroup> : null}
            </Select>
          </Field>
        </div>
      </section>

      <section aria-labelledby="activity-heading" className="border-t border-border pt-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">02 · Kegiatan</p>
          <h2 id="activity-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Informasi kegiatan</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama kegiatan" htmlFor="activity-name" required error={errors.activityName?.message} className="sm:col-span-2">
            <Input id="activity-name" maxLength={180} required aria-invalid={Boolean(errors.activityName)} aria-describedby={fieldDescriptionId('activity-name', errors.activityName)} {...register('activityName')} />
          </Field>
          <Field label="Tema" htmlFor="activity-theme" error={errors.theme?.message} className="sm:col-span-2">
            <Input id="activity-theme" maxLength={180} aria-invalid={Boolean(errors.theme)} aria-describedby={fieldDescriptionId('activity-theme', errors.theme)} {...register('theme')} />
          </Field>
          <Field label="Tanggal kegiatan" htmlFor="event-date" required error={errors.eventDate?.message}>
            <Input id="event-date" type="date" required aria-invalid={Boolean(errors.eventDate)} aria-describedby={fieldDescriptionId('event-date', errors.eventDate)} {...register('eventDate')} />
          </Field>
          <Field label="Lokasi / Link" htmlFor="event-location" error={errors.location?.message}>
            <Input id="event-location" maxLength={240} placeholder="Lokasi atau link pertemuan" aria-invalid={Boolean(errors.location)} aria-describedby={fieldDescriptionId('event-location', errors.location)} {...register('location')} />
          </Field>
          <Field label="Jam mulai" htmlFor="event-start-time" error={errors.eventStartTime?.message}>
            <Input id="event-start-time" type="time" aria-invalid={Boolean(errors.eventStartTime)} aria-describedby={fieldDescriptionId('event-start-time', errors.eventStartTime)} {...register('eventStartTime')} />
          </Field>
          <Field label="Jam selesai" htmlFor="event-end-time" error={errors.eventEndTime?.message}>
            <Input id="event-end-time" type="time" aria-invalid={Boolean(errors.eventEndTime)} aria-describedby={fieldDescriptionId('event-end-time', errors.eventEndTime)} {...register('eventEndTime')} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="design-heading" className="border-t border-border pt-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">03 · Kebutuhan desain</p>
          <h2 id="design-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Isi pamflet dan deadline</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Jenis kebutuhan" htmlFor="request-type" required error={errors.requestType?.message}>
            <Select id="request-type" required defaultValue="" aria-invalid={Boolean(errors.requestType)} aria-describedby={fieldDescriptionId('request-type', errors.requestType)} {...register('requestType')}>
              <option value="" disabled>Pilih jenis kebutuhan</option>
              {PAMFLET_REQUEST_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </Field>
          <Field label="Deadline pamflet" htmlFor="request-deadline" required error={errors.deadline?.message} description="Harus pada atau sebelum tanggal kegiatan.">
            <Input id="request-deadline" type="date" required aria-invalid={Boolean(errors.deadline)} aria-describedby={fieldDescriptionId('request-deadline', errors.deadline, true)} {...register('deadline')} />
          </Field>
          <Field label="Informasi yang harus dicantumkan" htmlFor="request-description" required error={errors.description?.message} className="sm:col-span-2">
            <Textarea id="request-description" rows={6} minLength={10} maxLength={5000} required placeholder="Tuliskan judul, waktu, tempat, narahubung, dan informasi penting lain sesuai kebutuhan." aria-invalid={Boolean(errors.description)} aria-describedby={fieldDescriptionId('request-description', errors.description)} {...register('description')} />
          </Field>
          <Field label="Contact Person pada pamflet" htmlFor="contact-person" error={errors.contactPerson?.message}>
            <Input id="contact-person" maxLength={180} placeholder="Nama dan nomor yang dicantumkan" aria-invalid={Boolean(errors.contactPerson)} aria-describedby={fieldDescriptionId('contact-person', errors.contactPerson)} {...register('contactPerson')} />
          </Field>
          <Field label="Link referensi / bahan" htmlFor="reference-link" error={errors.referenceLink?.message} description="Gunakan link HTTPS yang dapat dibuka Tim Komdigi.">
            <Input id="reference-link" type="url" inputMode="url" maxLength={2048} placeholder="https://drive.google.com/..." aria-invalid={Boolean(errors.referenceLink)} aria-describedby={fieldDescriptionId('reference-link', errors.referenceLink, true)} {...register('referenceLink')} />
          </Field>
          <Field label="Saran caption" htmlFor="request-caption" error={errors.caption?.message} className="sm:col-span-2">
            <Textarea id="request-caption" rows={4} maxLength={3000} aria-invalid={Boolean(errors.caption)} aria-describedby={fieldDescriptionId('request-caption', errors.caption)} {...register('caption')} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="material-heading" className="border-t border-border pt-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">04 · Bahan</p>
          <h2 id="material-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Lampiran pendukung</h2>
        </div>
        <FileUpload
          id="request-attachment"
          name="attachment"
          label="Upload file (opsional)"
          description="JPG, PNG, atau WebP maksimal 2 MB; PDF atau DOCX maksimal 10 MB. File disimpan privat."
          accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          maxSizeBytes={10 * 1024 * 1024}
          validateFiles={validateAttachment}
          onFilesChange={(files) => setAttachment(files[0] ?? null)}
          disabled={isSubmitting}
        />
      </section>

      <section aria-labelledby="notes-heading" className="border-t border-border pt-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">05 · Catatan</p>
          <h2 id="notes-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Catatan tambahan</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">Tambahkan konteks lain yang perlu diketahui Tim Komdigi.</p>
        </div>
        <Field label="Catatan tambahan" htmlFor="request-notes" error={errors.requesterNotes?.message}>
          <Textarea
            id="request-notes"
            rows={4}
            maxLength={3000}
            aria-invalid={Boolean(errors.requesterNotes)}
            aria-describedby={fieldDescriptionId('request-notes', errors.requesterNotes)}
            {...register('requesterNotes')}
          />
        </Field>
      </section>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="request-website">Website</label>
        <input id="request-website" type="text" tabIndex={-1} autoComplete="off" {...register('bot_field')} />
      </div>

      <div className="border-t border-border pt-7">
        <p className="mb-5 text-xs leading-5 text-text-muted">Dengan mengirim form, Anda menyatakan informasi yang diberikan benar dan dapat diproses oleh Admin Komdigi.</p>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Menyimpan Request…</> : 'Kirim Request'}
        </Button>
      </div>
    </form>
  )
}
