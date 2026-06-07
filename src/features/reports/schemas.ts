import { z } from 'zod'

export const reportSubmitSchema = z.object({
  eventId: z.string().cuid({ message: 'Event ID tidak valid' }),
  documentUrl: z.string().url({ message: 'URL dokumen tidak valid' }),
})

export type ReportSubmitInput = z.infer<typeof reportSubmitSchema>
