'use client'
'use no memo'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postCreateSchema, postUpdateSchema, type PostCreateInput, type PostUpdateInput } from '@/features/blog/schemas'
import { createPostAction, updatePostAction, uploadBlogCoverAction, uploadPostInlineImageAction } from '@/features/blog/actions'
import { ArticleEditor } from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Textarea } from '@/components/ui/textarea'
import { PostStatus } from '@prisma/client'

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
  ogImageUrl: string | null
  ogImagePublicId: string | null
  categoryId: string
  authorName: string | null
  programId?: string | null
  agendaId?: string | null
  status?: PostStatus
  scheduledAt?: Date | null
  revisionNotes?: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
}

export function PostForm({
  categories,
  programs = [],
  agendas = [],
  currentUserName,
  initialPost,
}: {
  categories: CategoryOption[]
  programs?: { id: string, name: string }[]
  agendas?: { id: string, name: string }[]
  currentUserName?: string | null
  initialPost?: InitialPost
}) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string>('')
  const [coverUploadMessage, setCoverUploadMessage] = useState<string>('')
  const [ogUploadMessage, setOgUploadMessage] = useState<string>('')
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
      ogImage: initialPost?.ogImageUrl || '',
      ogImagePublicId: initialPost?.ogImagePublicId || '',
      categoryId: initialPost?.categoryId || categories[0]?.id || '',
      authorName: initialPost?.authorName || currentUserName || '',
      programId: initialPost?.programId || '',
      agendaId: initialPost?.agendaId || '',
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

  const uploadOgImage = async (file: File | undefined) => {
    setOgUploadMessage('')
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadBlogCoverAction(formData)
    if (result.error) {
      setOgUploadMessage(result.error)
      return
    }
    setValue('ogImage', result.url || '', { shouldValidate: true, shouldDirty: true })
    setValue('ogImagePublicId', result.publicId || '', { shouldValidate: true, shouldDirty: true })
    setOgUploadMessage('OG image berhasil diupload.')
  }

  const uploadInlineImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadPostInlineImageAction(formData)
    return { url: result.url, error: result.error }
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
      <input type="hidden" {...register('ogImagePublicId')} />

      {initialPost?.status === PostStatus.REVISION && initialPost.revisionNotes ? (
        <Alert tone="warning" title="Perlu revisi">{initialPost.revisionNotes}</Alert>
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
            ikmicirebon.web.id/publikasi/kategori/
          </span>
          <Input id="slug" {...register('slug')} type="text" disabled={isSubmitting} />
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId?.message}>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <ListboxSelect
                id="categoryId"
                value={field.value ?? categories[0]?.id ?? ''}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
            )}
          />
        </Field>

        <Field label="Penulis" htmlFor="authorName" error={errors.authorName?.message}>
          <Input
            id="authorName"
            {...register('authorName')}
            type="text"
            placeholder="Masukkan nama penulis"
            disabled={isSubmitting}
          />
        </Field>
      </div>

      <div>
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
            <ArticleEditor value={field.value || ''} onChange={field.onChange} disabled={isSubmitting} onImageUpload={uploadInlineImage} />
          )}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Program Terkait (Opsional)</label>
          <Controller
            name="programId"
            control={control}
            render={({ field }) => (
              <ListboxSelect
                options={[{ value: '', label: 'Tidak ada' }, ...programs.map(p => ({ value: p.id, label: p.name }))]}
                value={field.value || ''}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Agenda Terkait (Opsional)</label>
          <Controller
            name="agendaId"
            control={control}
            render={({ field }) => (
              <ListboxSelect
                options={[{ value: '', label: 'Tidak ada' }, ...agendas.map(a => ({ value: a.id, label: a.name }))]}
                value={field.value || ''}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

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

      <Field label="OG Image" htmlFor="ogImage" error={errors.ogImage?.message}>
        <p className="text-xs leading-5 text-muted">Gambar khusus saat artikel dibagikan. Jika kosong, cover artikel digunakan.</p>
        <Input id="ogImage" {...register('ogImage')} type="url" placeholder="https://res.cloudinary.com/..." disabled={isSubmitting} />
        <Input id="ogImageFile" type="file" accept="image/jpeg,image/png,image/webp" disabled={isSubmitting} onChange={(event) => void uploadOgImage(event.target.files?.[0])} />
        {ogUploadMessage ? <p className="text-xs font-semibold text-muted">{ogUploadMessage}</p> : null}
      </Field>

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
