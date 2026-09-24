'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitRegistrationAction } from '@/features/registration/actions'
import { registrationCreateSchema, type RegistrationCreateInput } from '@/features/registration/schemas'
import { INDRAMAYU_DISTRICTS, INDRAMAYU_VILLAGES, isIndramayuDistrict } from '@/features/registration/indramayu-regions'

export function RegisterForm() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationCreateInput>({
    resolver: zodResolver(registrationCreateSchema),
    defaultValues: { consent: false },
  })
  const district = watch('district')
  const villages = isIndramayuDistrict(district) ? INDRAMAYU_VILLAGES[district] : []

  const onSubmit = async (data: RegistrationCreateInput) => {
    setGlobalError('')
    try {
      const result = await submitRegistrationAction(data)
      if (result.success && result.registrationNumber) {
        router.push(`/gabung/success?req=${encodeURIComponent(result.registrationNumber)}`)
        return
      }
      setGlobalError(result.error || 'Data belum dapat dikirim. Silakan coba kembali.')
    } catch {
      setGlobalError('Data belum dapat dikirim. Periksa koneksi lalu coba kembali.')
    }
  }

  const onInvalid = () => {
    setGlobalError('Periksa kembali bidang bertanda wajib dan pesan kesalahan pada formulir.')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5 md:p-6"
      noValidate
    >
      {globalError ? (
        <div className="mb-7 flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6">{globalError}</p>
        </div>
      ) : null}

      <section className="space-y-4" aria-labelledby="identity-heading">
        <div className="border-b border-border pb-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-accent">Bagian 1</p>
          <h3 id="identity-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Identitas utama</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap" htmlFor="fullName" error={errors.fullName?.message} required className="sm:col-span-2">
            <Input id="fullName" autoComplete="name" {...register('fullName')} disabled={isSubmitting} aria-invalid={Boolean(errors.fullName)} placeholder="Sesuai identitas Anda" />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" inputMode="email" autoComplete="email" {...register('email')} disabled={isSubmitting} aria-invalid={Boolean(errors.email)} placeholder="nama@email.com" />
          </Field>
          <Field label="Nomor WhatsApp" htmlFor="whatsapp" error={errors.whatsapp?.message} required>
            <Input id="whatsapp" type="tel" inputMode="tel" autoComplete="tel" {...register('whatsapp')} disabled={isSubmitting} aria-invalid={Boolean(errors.whatsapp)} placeholder="Contoh: 081234567890" />
          </Field>
        </div>
      </section>

      <section className="mt-6 space-y-4" aria-labelledby="background-heading">
        <div className="border-b border-border pb-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-accent">Bagian 2</p>
          <h3 id="background-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Pendidikan dan domisili</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kampus / institusi" htmlFor="campus" error={errors.campus?.message} required>
            <Input id="campus" {...register('campus')} disabled={isSubmitting} aria-invalid={Boolean(errors.campus)} placeholder="Nama kampus atau institusi" />
          </Field>
          <Field label="Program studi" htmlFor="major" error={errors.major?.message} required>
            <Input id="major" {...register('major')} disabled={isSubmitting} aria-invalid={Boolean(errors.major)} placeholder="Program studi Anda" />
          </Field>
          <Field label="Semester" htmlFor="semester" error={errors.semester?.message} required>
            <Select id="semester" {...register('semester')} disabled={isSubmitting} aria-invalid={Boolean(errors.semester)} defaultValue="">
              <option value="" disabled>Pilih semester</option>
              {Array.from({ length: 14 }, (_, index) => index + 1).map((semester) => (
                <option key={semester} value={String(semester)}>Semester {semester}</option>
              ))}
              <option value="Lainnya">Lainnya</option>
            </Select>
          </Field>
          <Field label="Tahun masuk" htmlFor="entryYear" error={errors.entryYear?.message} required>
            <Input id="entryYear" type="number" inputMode="numeric" min={1990} max={2100} {...register('entryYear')} disabled={isSubmitting} aria-invalid={Boolean(errors.entryYear)} placeholder="Contoh: 2026" />
          </Field>
          <Field label="Kecamatan asal" htmlFor="district" error={errors.district?.message} required>
            <Select id="district" {...register('district', { onChange: () => setValue('village', '', { shouldValidate: false }) })} disabled={isSubmitting} aria-invalid={Boolean(errors.district)}>
              <option value="">Pilih kecamatan</option>
              {INDRAMAYU_DISTRICTS.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
          </Field>
          <Field label="Desa / kelurahan" htmlFor="village" error={errors.village?.message} required>
            <Select id="village" {...register('village')} disabled={isSubmitting || !district} aria-invalid={Boolean(errors.village)}>
              <option value="">{district ? 'Pilih desa / kelurahan' : 'Pilih kecamatan dahulu'}</option>
              {villages.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
          </Field>
          <Field label="Alamat domisili" htmlFor="address" error={errors.address?.message} required className="sm:col-span-2">
            <Textarea id="address" rows={3} {...register('address')} disabled={isSubmitting} aria-invalid={Boolean(errors.address)} placeholder="Alamat tempat tinggal Anda saat ini" />
          </Field>
        </div>
      </section>

      <section className="mt-6 space-y-4" aria-labelledby="motivation-heading">
        <div className="border-b border-border pb-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-accent">Bagian 3</p>
          <h3 id="motivation-heading" className="mt-1 font-heading text-xl font-extrabold text-primary">Cerita singkat Anda</h3>
        </div>
        <Field label="Alasan ingin bergabung" htmlFor="reasons" error={errors.reasons?.message} required>
          <Textarea id="reasons" rows={4} {...register('reasons')} disabled={isSubmitting} aria-invalid={Boolean(errors.reasons)} placeholder="Ceritakan motivasi Anda bergabung bersama IKMI Cirebon" />
        </Field>
        <Field label="Pengalaman organisasi" htmlFor="organizationExperience" error={errors.organizationExperience?.message} description="Opsional">
          <Textarea id="organizationExperience" rows={3} {...register('organizationExperience')} disabled={isSubmitting} placeholder="Organisasi atau kegiatan yang pernah diikuti" />
        </Field>
      </section>

      <input {...register('bot_field')} type="text" className="sr-only" autoComplete="off" tabIndex={-1} aria-hidden="true" />

      <div className="mt-6 border-t border-border pt-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-text-secondary">
          <input type="checkbox" {...register('consent')} disabled={isSubmitting} className="mt-0.5 h-5 w-5 shrink-0 accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
          <span>Saya menyetujui penggunaan data ini untuk proses verifikasi dan komunikasi keanggotaan IKMI Cirebon.</span>
        </label>
        {errors.consent ? <p className="mt-2 text-sm font-semibold text-destructive" role="alert">{errors.consent.message}</p> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-4 w-full sm:w-auto">
          {isSubmitting ? 'Mengirim data...' : 'Kirim Data Bergabung'}
          {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
        </Button>
      </div>
    </form>
  )
}
