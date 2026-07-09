import { z } from 'zod'

export const generateLpjTokenSchema = z.object({
  activityName: z.string().min(3, { message: 'Nama kegiatan minimal 3 karakter' }),
  description: z.string().optional(),
  expiredAt: z.coerce.date({
    errorMap: () => ({ message: 'Tanggal expired tidak valid' }),
  }),
})

export type GenerateLpjTokenInput = z.infer<typeof generateLpjTokenSchema>
