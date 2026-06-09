'use server'

import { auth } from '@/core/auth/auth'
import { blogService } from './services'
import { postCreateSchema, postUpdateSchema, type PostCreateInput, type PostUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import type { Session } from 'next-auth'
import { rateLimit } from '@/core/security/rate-limiter'

function revalidateCmsPaths(slug?: string) {
  revalidatePath('/admin/cms/posts')
  revalidatePath('/admin/cms/analytics')
  revalidatePath('/blog')
  revalidatePath('/')
  if (slug) {
    revalidatePath(`/blog/${slug}`)
  }
}

function sessionUser(session: Session | null) {
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId,
  }
}

export async function createPostAction(data: PostCreateInput) {
  try {
    const session = await auth()
    const user = sessionUser(session)
    if (!user) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:create:${user.id}`, 30, 3600)

    const parsed = postCreateSchema.parse(data)
    await blogService.createPost(parsed, user.id, user.departmentId)

    revalidateCmsPaths(parsed.slug)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updatePostAction(data: PostUpdateInput) {
  try {
    const session = await auth()
    const user = sessionUser(session)
    if (!user) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:update:${user.id}`, 120, 3600)

    const parsed = postUpdateSchema.parse(data)
    await blogService.updatePost(parsed, user)

    revalidateCmsPaths(parsed.slug)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function submitPostForReviewAction(id: string) {
  try {
    const session = await auth()
    const user = sessionUser(session)
    if (!user) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:submit:${user.id}`, 60, 3600)

    await blogService.submitForReview(id, user)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function approvePostAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:approve:${session.user.id}`, 120, 3600)

    await blogService.approvePost(id, session.user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function publishPostAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:publish:${session.user.id}`, 120, 3600)

    await blogService.publishPost(id, session.user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function archivePostAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:archive:${session.user.id}`, 120, 3600)

    await blogService.archivePost(id, session.user.id)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deletePostAction(id: string) {
  try {
    const session = await auth()
    const user = sessionUser(session)
    if (!user) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:post:delete:${user.id}`, 60, 3600)

    await blogService.deletePost(id, user)
    revalidateCmsPaths()
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
