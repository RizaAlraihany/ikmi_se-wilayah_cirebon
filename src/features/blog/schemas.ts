import { z } from 'zod'

export const postCreateSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter' }).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan strip'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  authorName: z.string().trim().max(120, 'Nama penulis maksimal 120 karakter').optional(),
  content: z.string().min(10, { message: 'Konten terlalu pendek' }),
  excerpt: z.string().optional(),
  featuredImage: z.string().url({ message: 'URL gambar tidak valid' }).optional().or(z.literal('')),
  featuredImagePublicId: z.string().optional().or(z.literal('')),
  ogImage: z.string().url({ message: 'URL OG image tidak valid' }).optional().or(z.literal('')),
  ogImagePublicId: z.string().optional().or(z.literal('')),
  seoTitle: z.string().max(70, 'SEO title maksimal 70 karakter').optional(),
  seoDescription: z.string().max(160, 'SEO description maksimal 160 karakter').optional(),
  seoKeywords: z.string().max(240, 'SEO keywords maksimal 240 karakter').optional(),
  programId: z.string().optional().nullable(),
  agendaId: z.string().optional().nullable(),
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export const postUpdateSchema = postCreateSchema.partial().extend({
  id: z.string().min(1, 'ID Post tidak valid'),
})

export type PostUpdateInput = z.infer<typeof postUpdateSchema>

export const postIdSchema = z.object({
  id: z.string().min(1, 'ID Post tidak valid'),
})

export const postRevisionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  notes: z.string().trim().min(5, 'Catatan revisi minimal 5 karakter.').max(3000, 'Catatan revisi maksimal 3000 karakter.'),
})

export const postScheduleSchema = z.object({
  id: z.string().trim().min(1).max(80),
  scheduledAt: z.date().refine((value) => !Number.isNaN(value.getTime()), 'Jadwal publikasi tidak valid.'),
})
