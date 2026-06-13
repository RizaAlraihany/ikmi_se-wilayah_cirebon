import { z } from 'zod'

export const createLetterSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  subject: z.string().min(3, 'Perihal minimal 3 karakter'),
  fileUrl: z.string().url('URL Dokumen harus valid (Simulasi Upload)'),
  filePublicId: z.string().optional(),
  date: z.string().or(z.date()).transform(val => new Date(val))
})

export type CreateLetterInput = z.infer<typeof createLetterSchema>

export const updateLetterSchema = createLetterSchema.partial()
export type UpdateLetterInput = z.infer<typeof updateLetterSchema>
