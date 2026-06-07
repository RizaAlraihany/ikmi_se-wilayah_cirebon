import { z } from 'zod'

export const postCreateSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter' }),
  content: z.string().min(10, { message: 'Konten terlalu pendek' }),
  excerpt: z.string().optional(),
  featuredImage: z.string().url({ message: 'URL gambar tidak valid' }).optional().or(z.literal('')),
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export const postUpdateSchema = postCreateSchema.partial().extend({
  id: z.string().cuid('ID Post tidak valid'),
})

export type PostUpdateInput = z.infer<typeof postUpdateSchema>
