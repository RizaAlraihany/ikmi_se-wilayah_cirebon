'use server'

import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { KOMDIGI_DASHBOARD_ROLE_IDS, ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { webConfigService } from './services'
import { requireCmsUpdate } from '@/features/cms/access'
import { contactInfoSchema, type ContactInfoInput, type WebConfigInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateImageSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { safeActionError } from '@/core/errors/safe-action-error'
import { CONTACT_CONFIG_KEY } from './contact-contract'
import { isWritableWebConfigKey } from './policy'
import { aboutContentSchema, homepageContentSchema, pageHeroesContentSchema, type AboutContentInput, type HomepageContentInput, type PageHeroesContentInput } from './content-contract'

function revalidatePublicContact() {
  revalidatePath('/admin/cms/settings')
  revalidatePath('/kontak')
  revalidatePath('/', 'layout')
}

function revalidateHomepageContent() {
  revalidatePath('/admin/campaign')
  revalidatePath('/')
}

function revalidateAboutContent() {
  revalidatePath('/admin/organization/about')
  revalidatePath('/tentang')
}

function revalidatePageHeroesContent() {
  revalidatePath('/admin/campaign/pages')
  revalidatePath('/kegiatan')
  revalidatePath('/publikasi')
  revalidatePath('/kirim-tulisan')
  revalidatePath('/gabung')
  revalidatePath('/kontak')
}

export async function updateContactInfoAction(input: ContactInfoInput) {
  try {
    const actor = await requireAuth()
    await rateLimit(`cms:contact:${actor.id}`, 30, 3600)
    await webConfigService.updateContactInfo(contactInfoSchema.parse(input), actor)
    revalidatePublicContact()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Kontak publik belum dapat disimpan.', 'web_config.contact_update') }
  }
}

export async function updateHomepageContentAction(input: HomepageContentInput) {
  try {
    const actor = await requireAuth()
    await rateLimit(`cms:homepage:${actor.id}`, 30, 3600)
    await webConfigService.updateHomepageContent(homepageContentSchema.parse(input), actor)
    revalidateHomepageContent()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Konten Beranda belum dapat disimpan.', 'web_config.homepage_update') }
  }
}

export async function updateAboutContentAction(input: AboutContentInput) {
  try {
    const actor = await requireAuth()
    await rateLimit(`cms:about:${actor.id}`, 30, 3600)
    await webConfigService.updateAboutContent(aboutContentSchema.parse(input), actor)
    revalidateAboutContent()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Konten Tentang belum dapat disimpan.', 'web_config.about_update') }
  }
}

export async function updatePageHeroesContentAction(input: PageHeroesContentInput) {
  try {
    const actor = await requireAuth()
    await requireCmsUpdate(actor.id)
    await rateLimit(`cms:page-heroes:${actor.id}`, 30, 3600)
    await webConfigService.updatePageHeroesContent(pageHeroesContentSchema.parse(input), actor)
    revalidatePageHeroesContent()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Hero halaman belum dapat disimpan.', 'web_config.page_heroes_update') }
  }
}

/** Compatibility boundary for the retired generic WebConfig form. */
export async function upsertWebConfigAction(data: WebConfigInput) {
  try {
    if (!isWritableWebConfigKey(data.key) || data.key !== CONTACT_CONFIG_KEY) {
      throw new Error('Konfigurasi tersebut tidak dapat diubah dari modul Kontak.')
    }
    return await updateContactInfoAction(contactInfoSchema.parse(JSON.parse(data.valueJson) as unknown))
  } catch (error) {
    return { error: safeActionError(error, 'Kontak publik belum dapat disimpan.', 'web_config.contact_update') }
  }
}

async function uploadWebConfigImage(formData: FormData, roles: typeof KOMDIGI_DASHBOARD_ROLE_IDS | typeof ORGANIZATION_DASHBOARD_ROLE_IDS, purpose: string) {
  try {
    const actor = await requireAuth()
    await requireRoleForUser(actor, roles)
    await rateLimit(`cms:web-config:${purpose}:image:${actor.id}`, 40, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File gambar wajib dipilih.' }
    }

    const validation = await validateImageSignature(file)
    if (!validation.valid) return { error: validation.error || 'File gambar tidak valid.' }

    const uploaded = await storageService.uploadImage(file, cloudinaryFolders.website)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    return { error: safeActionError(error, 'Gambar website belum dapat diunggah.', `web_config.${purpose}_image_upload`) }
  }
}

export async function uploadHomepageImageAction(formData: FormData) {
  return uploadWebConfigImage(formData, KOMDIGI_DASHBOARD_ROLE_IDS, 'homepage')
}

export async function uploadAboutImageAction(formData: FormData) {
  return uploadWebConfigImage(formData, ORGANIZATION_DASHBOARD_ROLE_IDS, 'about')
}

export async function uploadKomdigiWebImageAction(formData: FormData) {
  return uploadWebConfigImage(formData, KOMDIGI_DASHBOARD_ROLE_IDS, 'komdigi')
}
