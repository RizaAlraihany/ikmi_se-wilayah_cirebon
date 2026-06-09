'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitComplaintSchema, type SubmitComplaintInput } from '@/features/complaints/schemas'
import { submitComplaintAction } from '@/features/complaints/actions'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function ComplaintForm() {
  const [globalMessage, setGlobalMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitComplaintInput>({
    resolver: zodResolver(submitComplaintSchema),
  })

  const onSubmit = async (data: SubmitComplaintInput) => {
    setGlobalMessage('')
    setIsSuccess(false)

    try {
      const result = await submitComplaintAction(data)
      if (result.error) {
        setGlobalMessage(result.error)
      } else {
        setIsSuccess(true)
        setGlobalMessage('Berhasil mengirim aduan. Tim Advokasi akan segera menindaklanjuti.')
        reset()
      }
    } catch {
      setGlobalMessage('Terjadi kesalahan tidak terduga. Silakan coba lagi nanti.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {globalMessage ? (
        <div className={isSuccess ? 'rounded-xl bg-success px-4 py-3 text-sm font-medium text-primary' : 'rounded-xl bg-danger px-4 py-3 text-sm font-medium text-primary'} role="status">
          {globalMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nama Lengkap" htmlFor="senderName" error={errors.senderName?.message}>
          <Input id="senderName" {...register('senderName')} type="text" placeholder="Anonim / Nama Asli" disabled={isSubmitting} />
        </Field>
        <Field label="Kampus" htmlFor="campus" error={errors.campus?.message}>
          <Input id="campus" {...register('campus')} type="text" placeholder="Contoh: STMIK IKMI Cirebon" disabled={isSubmitting} />
        </Field>
      </div>

      <Field label="Kategori Aduan" htmlFor="category" error={errors.category?.message}>
        <Select id="category" {...register('category')} disabled={isSubmitting}>
          <option value="">Pilih Kategori</option>
          <option value="Akademik">Akademik</option>
          <option value="Fasilitas">Fasilitas Kampus</option>
          <option value="Organisasi">Organisasi / Kegiatan</option>
          <option value="Layanan">Layanan Administratif</option>
          <option value="Lainnya">Lainnya</option>
        </Select>
      </Field>

      <Field label="Pesan Aduan" htmlFor="message" error={errors.message?.message}>
        <Textarea id="message" {...register('message')} rows={6} placeholder="Jelaskan secara detail keluhan atau aspirasi Anda..." disabled={isSubmitting} />
      </Field>

      <input {...register('bot_field')} type="text" className="hidden" autoComplete="off" tabIndex={-1} />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Mengirim...' : 'Kirim Aduan'}
      </Button>
    </form>
  )
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-primary">
        {label}
      </label>
      {children}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  )
}
