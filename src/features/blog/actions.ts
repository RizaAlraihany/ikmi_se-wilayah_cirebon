'use server'

import { requireAnyPermission, requirePermission } from '@/core/authorization/guards'
import { blogService } from './services'
import { bloggerImportService, type BloggerImportSelectionInput } from './blogger-import'
import { postCreateSchema, postUpdateSchema, type PostCreateInput, type PostUpdateInput } from './schemas'
import { publicationPath } from './publication-routes'
import { revalidatePath } from 'next/cache'


import { rateLimit } from '@/core/security/rate-limiter'
import { validateImageSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { parseJakartaContentDatetime } from '@/features/content-plan/domain'
import { safeActionError } from '@/core/errors/safe-action-error'

function revalidateCmsPaths(slug?: string) {
  revalidatePath('/admin/cms/posts')
  revalidatePath('/admin/cms/analytics')
  revalidatePath('/publikasi')
  revalidatePath('/publikasi/[...segments]', 'page')
  revalidatePath('/')
  if (slug) {
    revalidatePath(publicationPath(slug))
    revalidatePath(`/blog/${slug}`)
  }
}




export async function createPostAction(data: PostCreateInput) {
  try {
    const user = await requirePermission('post.create')
    await rateLimit(`cms:post:create:${user.id}`, 30, 3600)

    const parsed = postCreateSchema.parse(data)
    const post = await blogService.createPost(parsed, user)

    revalidateCmsPaths(post.slug)
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat dibuat.', 'post.create') }
  }
}

export async function updatePostAction(data: PostUpdateInput) {
  try {
    const user = await requirePermission('post.update')
    await rateLimit(`cms:post:update:${user.id}`, 120, 3600)

    const parsed = postUpdateSchema.parse(data)
    const post = await blogService.updatePost(parsed, user)

    revalidateCmsPaths(post.slug)
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat diperbarui.', 'post.update') }
  }
}

export async function uploadBlogCoverAction(formData: FormData) {
  try {
    const user = await requirePermission('post.create')
    await rateLimit(`cms:post:cover:${user.id}`, 30, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File cover wajib dipilih.' }
    }

    const validation = await validateImageSignature(file)
    if (!validation.valid) return { error: validation.error || 'File tidak valid.' }

    const uploaded = await storageService.uploadImage(file, cloudinaryFolders.blog)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    return { error: safeActionError(error, 'Cover belum dapat diunggah.', 'post.cover_upload') }
  }
}

export async function submitPostForReviewAction(id: string) {
  try {
    const user = await requireAnyPermission(['post.submit', 'post.publish'])
    await rateLimit(`cms:post:submit:${user.id}`, 60, 3600)

    await blogService.submitForReview(id, user)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat diajukan.', 'post.submit') }
  }
}

export async function approvePostAction(id: string) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:approve:${user.id}`, 120, 3600)

    await blogService.approvePost(id, user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat disetujui.', 'post.approve') }
  }
}

export async function requestPostRevisionAction(id: string, notes: string) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:revision:${user.id}`, 120, 3600)
    await blogService.requestRevision(id, notes, user.id)
    revalidateCmsPaths()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error, 'Revisi belum dapat diminta.', 'post.request_revision') }
  }
}

export async function schedulePostAction(id: string, localDatetime: string) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:schedule:${user.id}`, 120, 3600)
    await blogService.schedulePost(id, parseJakartaContentDatetime(localDatetime), user.id)
    revalidateCmsPaths()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error, 'Publikasi belum dapat dijadwalkan.', 'post.schedule') }
  }
}

export async function publishPostAction(id: string) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:publish:${user.id}`, 120, 3600)

    await blogService.publishPost(id, user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat diterbitkan.', 'post.publish') }
  }
}

export async function archivePostAction(id: string) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:archive:${user.id}`, 120, 3600)

    await blogService.archivePost(id, user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat diarsipkan.', 'post.archive') }
  }
}

export async function deletePostAction(id: string) {
  try {
    const user = await requirePermission('post.delete')
    await rateLimit(`cms:post:delete:${user.id}`, 60, 3600)

    await blogService.deletePost(id, user)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Publikasi belum dapat dihapus.', 'post.delete') }
  }
}

export async function getBloggerImportPreviewAction() {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:blogger-preview:${user.id}`, 12, 3600)

    const posts = await bloggerImportService.getPreview(user)
    return { success: true as const, posts }
  } catch (error) {
    return { success: false as const, error: safeActionError(error, 'Preview Blogger belum dapat dimuat.', 'post.publish') }
  }
}

export async function importBloggerPostsAction(input: BloggerImportSelectionInput) {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:blogger-import:${user.id}`, 6, 3600)

    const result = await bloggerImportService.importSelected(input, user)
    revalidateCmsPaths()
    return { success: true as const, ...result }
  } catch (error) {
    return { success: false as const, error: safeActionError(error, 'Postingan Blogger belum dapat diimpor.', 'post.publish') }
  }
}

export async function migrateBloggerImagesAction() {
  try {
    const user = await requirePermission('post.publish')
    await rateLimit(`cms:post:blogger-images:${user.id}`, 3, 3600)

    const result = await bloggerImportService.migrateImages(user)
    revalidateCmsPaths()
    return { success: true as const, ...result }
  } catch (error) {
    return { success: false as const, error: safeActionError(error, 'Gambar Blogger belum dapat dipindahkan.', 'post.publish') }
  }
}
