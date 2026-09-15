import { z } from 'zod'

export const PUBLICATION_CATEGORY_SLUGS = ['berita', 'opini', 'artikel', 'kajian'] as const

export const categoryCreateSchema = z.object({
  name: z.string().min(2, { message: 'Nama kategori minimal 2 karakter' }),
  slug: z.enum(PUBLICATION_CATEGORY_SLUGS, { message: 'Kategori publikasi hanya Berita, Opini, Artikel, atau Kajian.' }),
  description: z.string().min(5, { message: 'Deskripsi minimal 5 karakter' }),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().cuid('ID tidak valid'),
})

export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
