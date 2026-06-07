'use client'

import { useState } from 'react'
import { submitComplaintAction } from '@/features/complaints/actions'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function ComplaintForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setMessage('')

    const data = {
      senderName: formData.get('senderName'),
      campus: formData.get('campus'),
      category: formData.get('category'),
      message: formData.get('message'),
      bot_field: formData.get('bot_field'),
    }

    const result = await submitComplaintAction(data)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage('Berhasil mengirim aduan. Tim Advokasi akan segera menindaklanjuti.')
      const form = document.getElementById('complaint-form')
      if (form instanceof HTMLFormElement) {
        form.reset()
      }
    }

    setIsSubmitting(false)
  }

  return (
    <form id="complaint-form" action={handleSubmit} className="space-y-6">
      {message ? (
        <div className={message.includes('Berhasil') ? 'rounded-xl bg-success px-4 py-3 text-sm font-medium text-primary' : 'rounded-xl bg-danger px-4 py-3 text-sm font-medium text-primary'} role="status">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nama Lengkap" htmlFor="senderName">
          <Input id="senderName" name="senderName" type="text" required placeholder="Anonim / Nama Asli" />
        </Field>
        <Field label="Kampus" htmlFor="campus">
          <Select id="campus" name="campus" required>
            <option value="">Pilih Kampus</option>
            <option value="Kampus Pusat">Kampus Pusat</option>
            <option value="Kampus 2">Kampus 2</option>
          </Select>
        </Field>
      </div>

      <Field label="Kategori Aduan" htmlFor="category">
        <Select id="category" name="category" required>
          <option value="">Pilih Kategori</option>
          <option value="Akademik">Akademik</option>
          <option value="Fasilitas">Fasilitas Kampus</option>
          <option value="Organisasi">Organisasi / Kegiatan</option>
          <option value="Layanan">Layanan Administratif</option>
          <option value="Lainnya">Lainnya</option>
        </Select>
      </Field>

      <Field label="Pesan Aduan" htmlFor="message">
        <Textarea id="message" name="message" required rows={6} placeholder="Jelaskan secara detail keluhan atau aspirasi Anda..." />
      </Field>

      <input type="text" name="bot_field" className="hidden" autoComplete="off" tabIndex={-1} />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Mengirim...' : 'Kirim Aduan'}
      </Button>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-primary">
        {label}
      </label>
      {children}
    </div>
  )
}
