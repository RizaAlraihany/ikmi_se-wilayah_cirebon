import { z } from 'zod'

export const categoryCreateSchema = z.object({
  name: z.string().min(2, { message: 'Nama kategori minimal 2 karakter' }),
  slug: z.string().min(2, { message: 'Slug minimal 2 karakter' }).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan strip (-)'),
  description: z.string().min(5, { message: 'Deskripsi minimal 5 karakter' }),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().cuid('ID tidak valid'),
})

export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
