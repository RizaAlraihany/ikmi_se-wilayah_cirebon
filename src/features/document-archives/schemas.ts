import { z } from 'zod'

export const documentArchiveCategories = [
  'Proposal',
  'LPJ',
  'SOP',
  'Pedoman',
  'Notulen',
  'Surat',
  'Keputusan',
  'Kongres',
  'Kajian',
  'Laporan',
  'Lainnya',
] as const

const optionalId = z.preprocess((value) => value || undefined, z.string().cuid().optional())

export const createDocumentArchiveSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(160),
  category: z.enum(documentArchiveCategories),
  description: z.preprocess((value) => value?.toString().trim() || undefined, z.string().max(1000, 'Deskripsi maksimal 1000 karakter.').optional()),
  archivedAt: z.preprocess((value) => value || undefined, z.coerce.date()),
  organizationalUnitId: optionalId,
  periodId: optionalId,
  programId: optionalId,
  visibility: z.literal('INTERNAL').default('INTERNAL'),
}).strict()

export type CreateDocumentArchiveInput = z.infer<typeof createDocumentArchiveSchema>
export const updateDocumentArchiveSchema = createDocumentArchiveSchema.partial().strict()
export type UpdateDocumentArchiveInput = z.infer<typeof updateDocumentArchiveSchema>
