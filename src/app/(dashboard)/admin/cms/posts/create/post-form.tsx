'use client'
'use no memo'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postCreateSchema, postUpdateSchema, type PostCreateInput, type PostUpdateInput } from '@/features/blog/schemas'
import { createPostAction, updatePostAction, uploadBlogCoverAction } from '@/features/blog/actions'
import { Editor } from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type CategoryOption = {
  id: string
  name: string
}

type InitialPost = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  thumbnailUrl: string | null
  thumbnailPublicId: string | null
  categoryId: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
}

export function PostForm({ categories, initialPost }: { categories: CategoryOption[]; initialPost?: InitialPost }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string>('')
  const [coverUploadMessage, setCoverUploadMessage] = useState<string>('')
  const isEdit = Boolean(initialPost)

  const schema = isEdit ? postUpdateSchema : postCreateSchema

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateInput | PostUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: initialPost?.id,
      title: initialPost?.title || '',
      slug: initialPost?.slug || '',
      content: initialPost?.content || '',
      excerpt: initialPost?.excerpt || '',
      featuredImage: initialPost?.thumbnailUrl || '',
      featuredImagePublicId: initialPost?.thumbnailPublicId || '',
      categoryId: initialPost?.categoryId || categories[0]?.id || '',
      seoTitle: initialPost?.seoTitle || '',
      seoDescription: initialPost?.seoDescription || '',
      seoKeywords: initialPost?.seoKeywords || '',
    },
  })

  const generateSlug = () => {
    const title = getValues('title')
    if (!title) return

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setValue('slug', slug, { shouldValidate: true })
  }

  const uploadCover = async (file: File | undefined) => {
    setCoverUploadMessage('')
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadBlogCoverAction(formData)

    if (result.error) {
      setCoverUploadMessage(result.error)
      return
    }

    setValue('featuredImage', result.url || '', { shouldValidate: true, shouldDirty: true })
    setValue('featuredImagePublicId', result.publicId || '', { shouldValidate: true, shouldDirty: true })
    setCoverUploadMessage('Cover berhasil diupload ke Cloudinary.')
  }

  const onSubmit = async (data: PostCreateInput | PostUpdateInput) => {
    setGlobalError('')
    const result = isEdit
      ? await updatePostAction(data as PostUpdateInput)
      : await createPostAction(data as PostCreateInput)

    if (result?.error) {
      setGlobalError(result.error)
    } else {
      router.push('/admin/cms/posts')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {globalError ? (
        <div className="rounded-xl bg-danger px-4 py-3 text-sm font-medium text-primary" role="alert">
          {globalError}
        </div>
      ) : null}

      {initialPost ? <input type="hidden" {...register('id')} /> : null}
      <input type="hidden" {...register('featuredImagePublicId')} />

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
            ikmicirebon.or.id/blog/
          </span>
          <Input id="slug" {...register('slug')} type="text" disabled={isSubmitting} />
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId?.message}>
          <Select
            id="categoryId"
            {...register('categoryId')}
            disabled={isSubmitting}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Featured Image URL" htmlFor="featuredImage" error={errors.featuredImage?.message}>
          <Input id="featuredImage" {...register('featuredImage')} type="url" placeholder="https://res.cloudinary.com/..." disabled={isSubmitting} />
          <Input
            id="featuredImageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isSubmitting}
            onChange={(event) => void uploadCover(event.target.files?.[0])}
          />
          {coverUploadMessage ? <p className="text-xs font-semibold text-muted">{coverUploadMessage}</p> : null}
        </Field>
      </div>

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
            <Editor value={field.value || ''} onChange={field.onChange} />
          )}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="SEO Title" htmlFor="seoTitle" error={errors.seoTitle?.message}>
          <Input id="seoTitle" {...register('seoTitle')} disabled={isSubmitting} />
        </Field>
        <Field label="SEO Description" htmlFor="seoDescription" error={errors.seoDescription?.message}>
          <Textarea id="seoDescription" {...register('seoDescription')} rows={3} disabled={isSubmitting} />
        </Field>
        <Field label="SEO Keywords" htmlFor="seoKeywords" error={errors.seoKeywords?.message}>
          <Textarea id="seoKeywords" {...register('seoKeywords')} rows={3} disabled={isSubmitting} />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || categories.length === 0}>
          {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Draf'}
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
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  )
}
