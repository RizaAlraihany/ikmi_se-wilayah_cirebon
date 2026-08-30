'use server'

import { ContentPlanStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { AppError } from '@/core/errors/custom-errors'
import { requireContentPlanActor } from './access'
import { parseJakartaContentDatetime } from './domain'
import { contentPlanService } from './services'

function value(formData: FormData, key: string) {
  const field = formData.get(key)
  return typeof field === 'string' ? field.trim() : ''
}

function optionalValue(formData: FormData, key: string) {
  return value(formData, key) || null
}

function formInput(formData: FormData) {
  return {
    title: value(formData, 'title'),
    platform: value(formData, 'platform'),
    contentType: value(formData, 'contentType'),
    programId: optionalValue(formData, 'programId'),
    agendaId: optionalValue(formData, 'agendaId'),
    notes: optionalValue(formData, 'notes'),
    assetUrl: optionalValue(formData, 'assetUrl'),
    publishedUrl: optionalValue(formData, 'publishedUrl'),
    publishDate: parseJakartaContentDatetime(value(formData, 'publishDate')),
    status: value(formData, 'status') || ContentPlanStatus.PLANNED,
    authorId: value(formData, 'authorId'),
    // Relasi Request hanya boleh dibuat melalui action konversi khusus di bawah.
    pamfletRequestId: null,
  }
}

function safeActionError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message || 'Data Content Plan tidak valid.'
  if (error instanceof AppError && error.statusCode < 500) return error.message
  console.error('Content Plan action failed.', error)
  return 'Content Plan belum dapat disimpan. Coba lagi.'
}

function revalidateContentPlan() {
  revalidatePath('/admin/cms/content-plan')
  revalidatePath('/admin')
}

export async function convertPamfletRequestToContentPlanAction(requestId: string, formData: FormData) {
  try {
    const actor = await requireContentPlanActor()
    const publishDate = parseJakartaContentDatetime(value(formData, 'publishDate'))
    const plan = await contentPlanService.createPlan({
      // Judul, relasi, catatan, dan bahan selalu diambil ulang dari Request di server.
      title: 'Request Pamflet',
      platform: value(formData, 'platform'),
      contentType: value(formData, 'contentType'),
      programId: null,
      agendaId: null,
      notes: null,
      assetUrl: null,
      publishedUrl: null,
      publishDate,
      status: ContentPlanStatus.PLANNED,
      authorId: value(formData, 'authorId'),
      pamfletRequestId: requestId,
    }, actor.id)
    revalidateContentPlan()
    revalidatePath(`/admin/request-pamflet/${requestId}`)
    revalidatePath('/admin/request-pamflet')
    return {
      success: true as const,
      contentPlanId: plan.id,
      month: Number.isNaN(publishDate.getTime()) ? null : value(formData, 'publishDate').slice(0, 7),
    }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}

export async function createContentPlanAction(formData: FormData) {
  try {
    const actor = await requireContentPlanActor()
    const input = formInput(formData)
    await contentPlanService.createPlan({ ...input, authorId: input.authorId || actor.id }, actor.id)
    revalidateContentPlan()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}

export async function updateContentPlanAction(id: string, formData: FormData) {
  try {
    const actor = await requireContentPlanActor()
    await contentPlanService.updatePlan({ id, ...formInput(formData) }, actor.id)
    revalidateContentPlan()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}

export async function updateContentPlanStatusAction(id: string, status: ContentPlanStatus) {
  try {
    const actor = await requireContentPlanActor()
    if (status === ContentPlanStatus.PUBLISHED) await contentPlanService.publishPlan(id, actor.id)
    else await contentPlanService.updatePlan({ id, status }, actor.id)
    revalidateContentPlan()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}
