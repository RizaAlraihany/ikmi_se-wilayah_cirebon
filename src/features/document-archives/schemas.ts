import { z } from 'zod'

export const documentArchiveCategories = [
  'Organisasi',
  'Kegiatan',
  'Persuratan',
  'Keuangan',
  'Lainnya',
] as const

export const createDocumentArchiveSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  category: z.enum(documentArchiveCategories),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  fileUrl: z.string().url('URL dokumen harus valid'),
  filePublicId: z.string().optional(),
  archivedAt: z.string().or(z.date()).transform((value) => new Date(value)),
})

export type CreateDocumentArchiveInput = z.infer<typeof createDocumentArchiveSchema>

export const updateDocumentArchiveSchema = createDocumentArchiveSchema.partial()
export type UpdateDocumentArchiveInput = z.infer<typeof updateDocumentArchiveSchema>
