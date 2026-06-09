import { z } from 'zod'

export const postCreateSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter' }).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan strip'),
  categoryId: z.string().cuid('Kategori tidak valid'),
  content: z.string().min(10, { message: 'Konten terlalu pendek' }),
  excerpt: z.string().optional(),
  featuredImage: z.string().url({ message: 'URL gambar tidak valid' }).optional().or(z.literal('')),
  seoTitle: z.string().max(70, 'SEO title maksimal 70 karakter').optional(),
  seoDescription: z.string().max(160, 'SEO description maksimal 160 karakter').optional(),
  seoKeywords: z.string().max(240, 'SEO keywords maksimal 240 karakter').optional(),
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export const postUpdateSchema = postCreateSchema.partial().extend({
  id: z.string().cuid('ID Post tidak valid'),
})

export type PostUpdateInput = z.infer<typeof postUpdateSchema>

export const postIdSchema = z.object({
  id: z.string().cuid('ID Post tidak valid'),
})
