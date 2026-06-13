'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { registrationCreateSchema, type RegistrationCreateInput } from '@/features/registration/schemas'
import { submitRegistrationAction } from '@/features/registration/actions'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function RegisterForm() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string>('')


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationCreateInput>({
    resolver: zodResolver(registrationCreateSchema),
  })

  const onSubmit = async (data: RegistrationCreateInput) => {
    setGlobalError('')
    try {
      const result = await submitRegistrationAction(data)

      if (result?.error) {
        setGlobalError(result.error)
      } else {
        router.push('/gabung/success')
      }
    } catch {
      setGlobalError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
      {globalError ? (
        <div className="rounded-xl bg-danger px-3 py-2.5 text-sm font-medium text-primary md:px-4 md:py-3" role="alert">
          {globalError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <Field label="Nama Lengkap" htmlFor="fullName" error={errors.fullName?.message} full>
          <Input id="fullName" {...register('fullName')} type="text" placeholder="Sesuai KTP/KTM" disabled={isSubmitting} />
        </Field>
        <Field label="Asal Kampus / Institusi" htmlFor="campus" error={errors.campus?.message}>
          <Input id="campus" {...register('campus')} type="text" placeholder="Contoh: STMIK IKMI Cirebon" disabled={isSubmitting} />
        </Field>
        <Field label="Jurusan" htmlFor="major" error={errors.major?.message}>
          <Input id="major" {...register('major')} type="text" placeholder="Contoh: Teknik Informatika" disabled={isSubmitting} />
        </Field>
        <Field label="Semester" htmlFor="semester" error={errors.semester?.message}>
          <Select id="semester" {...register('semester')} disabled={isSubmitting}>
            <option value="">Pilih Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="Lainnya">Lainnya</option>
          </Select>
        </Field>
        <Field label="Nomor WhatsApp" htmlFor="whatsapp" error={errors.whatsapp?.message}>
          <Input id="whatsapp" {...register('whatsapp')} type="tel" placeholder="Contoh: 081234567890" disabled={isSubmitting} />
        </Field>
        <Field label="Alamat Lengkap" htmlFor="address" error={errors.address?.message} full>
          <Textarea id="address" {...register('address')} rows={3} placeholder="Masukkan alamat domisili saat ini" disabled={isSubmitting} />
        </Field>
        <Field label="Alasan Bergabung" htmlFor="reasons" error={errors.reasons?.message} full>
          <Textarea id="reasons" {...register('reasons')} rows={4} placeholder="Ceritakan motivasi Anda bergabung bersama IKMI" disabled={isSubmitting} />
        </Field>
        <input {...register('bot_field')} type="text" className="hidden" autoComplete="off" tabIndex={-1} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="min-h-10 w-full text-sm md:min-h-11">
        {isSubmitting ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
      </Button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
  full = false,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'space-y-1.5 md:col-span-2 md:space-y-2' : 'space-y-1.5 md:space-y-2'}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-primary md:text-sm">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-primary md:text-sm">{error}</p> : null}
    </div>
  )
}
