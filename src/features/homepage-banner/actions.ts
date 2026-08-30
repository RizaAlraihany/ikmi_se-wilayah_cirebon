'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { auth } from '@/core/auth/auth'
import { AppError } from '@/core/errors/custom-errors'
import { parseJakartaCampaignDatetime } from './domain'
import { homepageBannerService } from './services'

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function campaignFormInput(formData: FormData) {
  return {
    internalTitle: formData.get('internalTitle'),
    phase: formData.get('phase'),
    headline: formData.get('headline'),
    supportingText: optionalString(formData.get('supportingText')),
    desktopImage: formData.get('desktopImage'),
    mobileImage: formData.get('mobileImage'),
    ctaLabel: optionalString(formData.get('ctaLabel')),
    ctaUrl: optionalString(formData.get('ctaUrl')),
    status: formData.get('status') || 'DRAFT',
    priority: formData.get('priority') || 0,
    programId: optionalString(formData.get('programId')),
    startAt: parseJakartaCampaignDatetime(formData.get('startAt')),
    endAt: parseJakartaCampaignDatetime(formData.get('endAt')),
  }
}

function safeActionError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message || 'Data banner tidak valid.'
  if (error instanceof AppError && error.statusCode < 500) return error.message
  console.error('Homepage banner action failed.', error)
  return 'Banner belum dapat disimpan. Coba lagi.'
}

async function currentActorId() {
  const session = await auth()
  return session?.user?.id ?? null
}

function revalidateCampaignRoutes() {
  revalidatePath('/')
  revalidatePath('/admin/campaign')
}

export async function createHomepageBanner(formData: FormData) {
  const actorId = await currentActorId()
  if (!actorId) return { success: false as const, error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const banner = await homepageBannerService.create(campaignFormInput(formData), actorId)
    revalidateCampaignRoutes()
    return { success: true as const, data: { id: banner.id } }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}

export async function updateHomepageBanner(id: string, formData: FormData) {
  const actorId = await currentActorId()
  if (!actorId) return { success: false as const, error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const banner = await homepageBannerService.update(id, campaignFormInput(formData), actorId)
    revalidateCampaignRoutes()
    return { success: true as const, data: { id: banner.id } }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}

export async function archiveHomepageBanner(id: string) {
  const actorId = await currentActorId()
  if (!actorId) return { success: false as const, error: 'Anda harus masuk terlebih dahulu.' }

  try {
    await homepageBannerService.archive(id, actorId)
    revalidateCampaignRoutes()
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: safeActionError(error) }
  }
}
