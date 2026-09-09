import { z } from 'zod'
import { isSafeCampaignImageUrl } from '@/features/homepage-banner/domain'

export const cabinetSchema = z.object({
  tagline: z.string().trim().max(200),
  description: z.string().trim().max(2000),
  vision: z.string().trim().min(3).max(2000),
  missions: z.array(z.string().trim().min(3).max(1000)).min(1).max(12),
  logoUrl: z.string().trim().max(2048).refine((value) => !value || isSafeCampaignImageUrl(value), 'URL logo harus berupa gambar lokal atau HTTPS Cloudinary.'),
})
export type CabinetInput = z.infer<typeof cabinetSchema>
export const cabinetConfigKey = (periodId: string) => `cabinet:${periodId}`
