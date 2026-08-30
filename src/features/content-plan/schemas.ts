import { ContentPlanStatus } from '@prisma/client'
import { z } from 'zod'
import { CONTENT_PLATFORMS, CONTENT_TYPES, isSafeContentUrl } from './domain'

const optionalId = z.string().trim().min(1).max(80).optional().nullable()
const optionalUrl = z.string().trim().max(2048).refine((value) => !value || isSafeContentUrl(value), 'URL harus berupa path internal atau URL HTTPS.').optional().nullable()

export const contentPlanCreateSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(180, 'Judul maksimal 180 karakter.'),
  platform: z.enum(CONTENT_PLATFORMS),
  contentType: z.enum(CONTENT_TYPES),
  programId: optionalId,
  agendaId: optionalId,
  notes: z.string().trim().max(5000, 'Catatan maksimal 5000 karakter.').optional().nullable(),
  assetUrl: optionalUrl,
  publishedUrl: optionalUrl,
  publishDate: z.date().refine((value) => !Number.isNaN(value.getTime()), 'Jadwal publikasi tidak valid.'),
  status: z.nativeEnum(ContentPlanStatus).default(ContentPlanStatus.PLANNED),
  authorId: z.string().trim().min(1, 'PIC wajib dipilih.').max(80),
  pamfletRequestId: optionalId,
}).superRefine((data, context) => {
  if (data.status === 'PUBLISHED' && !data.publishedUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedUrl'], message: 'URL publikasi wajib diisi untuk status Dipublikasikan.' })
  }
})

export const contentPlanUpdateSchema = contentPlanCreateSchema.innerType().partial().extend({
  id: z.string().trim().min(1, 'ID content plan tidak valid.').max(80),
})

export type ContentPlanCreateInput = z.infer<typeof contentPlanCreateSchema>
export type ContentPlanUpdateInput = z.infer<typeof contentPlanUpdateSchema>
