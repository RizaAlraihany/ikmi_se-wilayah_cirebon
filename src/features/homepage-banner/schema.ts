import { z } from 'zod'
import {
  CAMPAIGN_PHASES,
  EDITABLE_CAMPAIGN_STATUSES,
  isSafeCampaignCtaUrl,
  isSafeCampaignImageUrl,
} from './domain'

export const homepageBannerSchema = z.object({
  programId: z.string().trim().min(1).max(64).optional().nullable(),
  internalTitle: z.string().trim().min(3, 'Judul internal minimal 3 karakter.').max(120, 'Judul internal maksimal 120 karakter.'),
  phase: z.enum(CAMPAIGN_PHASES),
  headline: z.string().trim().min(3, 'Headline minimal 3 karakter.').max(160, 'Headline maksimal 160 karakter.'),
  supportingText: z.string().trim().max(320, 'Teks pendukung maksimal 320 karakter.').optional().nullable(),
  desktopImage: z.string().trim().max(2048).refine(isSafeCampaignImageUrl, 'Gambar desktop harus berupa path lokal atau URL HTTPS Cloudinary.'),
  mobileImage: z.string().trim().max(2048).refine(isSafeCampaignImageUrl, 'Gambar mobile harus berupa path lokal atau URL HTTPS Cloudinary.'),
  ctaLabel: z.string().trim().max(48, 'Label CTA maksimal 48 karakter.').optional().nullable(),
  ctaUrl: z.string().trim().max(2048).refine((value) => !value || isSafeCampaignCtaUrl(value), 'CTA harus berupa path internal atau URL HTTPS.').optional().nullable(),
  startAt: z.date().optional().nullable(),
  endAt: z.date().optional().nullable(),
  priority: z.coerce.number().int().min(-100).max(100).default(0),
  status: z.enum(EDITABLE_CAMPAIGN_STATUSES),
}).superRefine((data, context) => {
  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Waktu selesai harus setelah waktu mulai.' })
  }
  if (data.status === 'SCHEDULED' && !data.startAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['startAt'], message: 'Status terjadwal memerlukan waktu mulai.' })
  }
  if (Boolean(data.ctaLabel) !== Boolean(data.ctaUrl)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['ctaUrl'], message: 'Label dan URL CTA harus diisi bersama.' })
  }
})

export type HomepageBannerInput = z.infer<typeof homepageBannerSchema>
