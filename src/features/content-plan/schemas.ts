import { ContentPlanStatus } from '@prisma/client'
import { z } from 'zod'

export const contentPlanCreateSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  platform: z.string().min(2, 'Platform wajib diisi'),
  publishDate: z.coerce.date(),
  status: z.nativeEnum(ContentPlanStatus).default(ContentPlanStatus.PLANNED),
  authorId: z.string().cuid('Penulis tidak valid'),
})

export const contentPlanUpdateSchema = contentPlanCreateSchema.partial().extend({
  id: z.string().cuid('ID content plan tidak valid'),
})

export type ContentPlanCreateInput = z.infer<typeof contentPlanCreateSchema>
export type ContentPlanUpdateInput = z.infer<typeof contentPlanUpdateSchema>
