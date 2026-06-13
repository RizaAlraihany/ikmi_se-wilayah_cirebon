'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginAction } from '@/features/auth/actions'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [globalError, setGlobalError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setGlobalError('')
    try {
      const result = await loginAction(data)

      if (result?.error) {
        setGlobalError(result.error)
      }
    } catch {
      setGlobalError('Terjadi kesalahan yang tidak terduga.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {globalError ? (
        <div className="rounded-xl bg-danger px-4 py-3 text-center text-sm font-medium text-primary" role="alert">
          {globalError}
        </div>
      ) : null}

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" {...register('email')} type="email" placeholder="admin@ikmi.ac.id" autoComplete="email" />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" {...register('password')} type="password" placeholder="Masukkan password" autoComplete="current-password" />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Memverifikasi...' : 'Masuk'}
      </Button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-primary">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm font-medium text-primary">{error}</p> : null}
    </div>
  )
}
