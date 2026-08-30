import { z } from 'zod'

export const submitKaryaTulisSchema = z.object({
  title: z.string().min(5, 'Judul tulisan minimal 5 karakter').max(150, 'Judul terlalu panjang'),
  category: z.enum(['Opini', 'Artikel', 'Kajian'], { required_error: 'Kategori tulisan harus dipilih' }),
  topic: z.string().trim().max(120, 'Topik maksimal 120 karakter').optional(),
  summary: z.string().max(500, 'Ringkasan maksimal 500 karakter').optional(),

  // Identitas
  authorName: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  authorEmail: z.string().email('Format email tidak valid'),
  authorWhatsapp: z.string().min(9, 'Nomor WhatsApp tidak valid').max(20),
  authorStatus: z.enum(['Anggota', 'Pengurus'], { required_error: 'Status IKMI harus dipilih' }),
  authorUnit: z.string().trim().max(120, 'Unit maksimal 120 karakter').optional(),
  consent: z.literal('on', { errorMap: () => ({ message: 'Persetujuan pengiriman wajib dicentang.' }) }),

  // File
  fileUrl: z.string().optional(), // This will be set by the action
  filePublicId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.authorStatus === 'Pengurus' && !data.authorUnit) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['authorUnit'], message: 'Unit / Departemen wajib diisi untuk Pengurus.' })
  }
})

export type SubmitKaryaTulisInput = z.infer<typeof submitKaryaTulisSchema>
