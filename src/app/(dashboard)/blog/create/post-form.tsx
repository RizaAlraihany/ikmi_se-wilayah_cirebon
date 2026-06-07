'use client'
'use no memo'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postCreateSchema, type PostCreateInput } from '@/features/blog/schemas'
import { createPostAction } from '@/features/blog/actions'
import { Editor } from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function PostForm() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string>('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { content: '' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const title = watch('title')
  const generateSlug = () => {
    if (!title) return

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setValue('slug', slug, { shouldValidate: true })
  }

  const onSubmit = async (data: PostCreateInput) => {
    setGlobalError('')
    try {
      const result = await createPostAction(data)

      if (result?.error) {
        setGlobalError(result.error)
      } else {
        router.push('/admin/posts')
      }
    } catch {
      setGlobalError('Terjadi kesalahan saat menyimpan artikel.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {globalError ? (
        <div className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-primary" role="alert">
          {globalError}
        </div>
      ) : null}

      <Field label="Judul Artikel" htmlFor="title" error={errors.title?.message}>
        <Input
          id="title"
          {...register('title')}
          onBlur={generateSlug}
          type="text"
          placeholder="Masukkan judul artikel"
          disabled={isSubmitting}
        />
      </Field>

      <Field label="Slug URL" htmlFor="slug" error={errors.slug?.message}>
        <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
          <span className="inline-flex h-11 items-center rounded-xl bg-background px-4 text-sm font-medium text-muted ring-1 ring-line">
            ikmi.ac.id/blog/
          </span>
          <Input id="slug" {...register('slug')} type="text" disabled={isSubmitting} />
        </div>
      </Field>

      <Field label="Ringkasan" htmlFor="excerpt">
        <Textarea
          id="excerpt"
          {...register('excerpt')}
          rows={2}
          placeholder="Ringkasan singkat artikel untuk halaman depan"
          disabled={isSubmitting}
        />
      </Field>

      <Field label="Konten Artikel" htmlFor="content" error={errors.content?.message}>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Editor value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Draf'}
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
