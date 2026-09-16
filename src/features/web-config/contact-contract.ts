import { z } from 'zod'

export const CONTACT_CONFIG_KEY = 'contact_info' as const

export type PublicContactInfo = {
  email: string | null
  whatsapp: string | null
  address: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
}

export const emptyPublicContactInfo: PublicContactInfo = {
  email: null,
  whatsapp: null,
  address: null,
  instagram: null,
  tiktok: null,
  youtube: null,
}

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

export function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function isValidWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

function isValidEmail(value: string) {
  return z.string().email().safeParse(value).success
}

/** Tolerant legacy reader: malformed stored values are omitted, never thrown. */
export function normalizePublicContactInfo(value: unknown): PublicContactInfo {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyPublicContactInfo

  const contact = value as Record<string, unknown>
  const email = optionalText(contact.email, 254)
  const whatsapp = optionalText(contact.whatsapp, 32)
  const instagram = optionalText(contact.instagram, 2048)
  const tiktok = optionalText(contact.tiktok, 2048)
  const youtube = optionalText(contact.youtube, 2048)

  return {
    email: email && isValidEmail(email) ? email : null,
    whatsapp: whatsapp && isValidWhatsApp(whatsapp) ? whatsapp : null,
    address: optionalText(contact.address, 500),
    instagram: instagram && isSafeExternalUrl(instagram) ? instagram : null,
    tiktok: tiktok && isSafeExternalUrl(tiktok) ? tiktok : null,
    youtube: youtube && isSafeExternalUrl(youtube) ? youtube : null,
  }
}

const nullableText = (maxLength: number) => z.union([z.string().trim().max(maxLength), z.null()]).transform((value) => value || null)

/** Strict mutation payload; the selected fields are the complete contact module. */
export const contactInfoSchema = z.object({
  email: nullableText(254),
  whatsapp: nullableText(32),
  address: nullableText(500),
  instagram: nullableText(2048),
  tiktok: nullableText(2048),
  youtube: nullableText(2048),
}).strict().superRefine((value, context) => {
  if (value.email && !isValidEmail(value.email)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email tidak valid.' })
  }
  if (value.whatsapp && !isValidWhatsApp(value.whatsapp)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['whatsapp'], message: 'Nomor WhatsApp tidak valid.' })
  }
  for (const field of ['instagram', 'tiktok', 'youtube'] as const) {
    if (value[field] && !isSafeExternalUrl(value[field])) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: 'URL harus memakai http atau https.' })
    }
  }
})

export type ContactInfoInput = z.infer<typeof contactInfoSchema>
