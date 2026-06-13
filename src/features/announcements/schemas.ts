import { z } from 'zod'

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter' }).max(200),
  content: z.string().min(10, { message: 'Isi pengumuman minimal 10 karakter' }),
})

export const updateAnnouncementSchema = createAnnouncementSchema.partial()

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
