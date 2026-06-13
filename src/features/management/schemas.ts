import { z } from 'zod'

export const updatePengurusSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal 2 karakter' }).optional(),
  positionId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  whatsappNumber: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
})

export type UpdatePengurusInput = z.infer<typeof updatePengurusSchema>
