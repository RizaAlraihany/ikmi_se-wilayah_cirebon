'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Department, Role } from '@prisma/client'
import { userCreateSchema, type UserCreateInput } from '@/features/users/schemas'
import { createUserAction } from '@/features/users/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { PasswordInput } from '@/components/ui/password-input'

interface UserFormProps {
  roles: Role[]
  departments: Department[]
}

export function UserForm({ roles, departments }: UserFormProps) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string>('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      roleId: '',
      departmentId: '',
    },
  })

  const onSubmit = async (data: UserCreateInput) => {
    setGlobalError('')
    try {
      const result = await createUserAction(data)

      if (result?.error) {
        setGlobalError(result.error)
      } else {
        router.push('/admin/users')
      }
    } catch {
      setGlobalError('Terjadi kesalahan yang tidak terduga.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {globalError ? (
        <div className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-primary" role="alert">
          {globalError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nama Lengkap" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register('name')} type="text" disabled={isSubmitting} />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" {...register('email')} type="email" disabled={isSubmitting} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" {...register('password')} disabled={isSubmitting} />
        </Field>

        <Field label="Role" htmlFor="roleId" error={errors.roleId?.message}>
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <ListboxSelect
                id="roleId"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Pilih Role' },
                  ...roles.map((role) => ({ value: role.id, label: role.name })),
                ]}
              />
            )}
          />
        </Field>

        <Field label="Departemen" htmlFor="departmentId" error={errors.departmentId?.message}>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <ListboxSelect
                id="departmentId"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Pilih Departemen' },
                  ...departments.map((department) => ({ value: department.id, label: department.name })),
                ]}
              />
            )}
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
        </Button>
      </div>
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
