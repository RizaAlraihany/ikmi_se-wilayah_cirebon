import { z } from 'zod'

export const reportSubmitSchema = z.object({
  title: z.string().min(3, { message: 'Judul LPJ minimal 3 karakter' }),
  eventId: z.string().cuid().optional(),
  lpjTokenId: z.string().optional(),
  documentUrl: z.string().url({ message: 'URL dokumen tidak valid' }),
  documentPublicId: z.string().optional(),
})

export const reportVerifySchema = z.object({
  notes: z.string().optional(),
})

export type ReportSubmitInput = z.infer<typeof reportSubmitSchema>
export type ReportVerifyInput = z.infer<typeof reportVerifySchema>
