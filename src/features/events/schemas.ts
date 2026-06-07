import { z } from 'zod'
import { EventStatus } from '@prisma/client'

export const eventCreateSchema = z.object({
  programId: z.string().cuid({ message: 'Program ID tidak valid' }),
  title: z.string().min(5, { message: 'Judul minimal 5 karakter' }),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
  location: z.string().min(3, { message: 'Lokasi minimal 3 karakter' }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  status: z.nativeEnum(EventStatus).optional()
})

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
