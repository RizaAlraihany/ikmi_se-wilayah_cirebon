import { z } from 'zod'

export const registrationCreateSchema = z.object({
  fullName: z.string().trim().min(3, { message: 'Nama lengkap minimal 3 karakter' }).max(160),
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(254),
  campus: z.string().trim().min(3, { message: 'Nama kampus wajib diisi' }).max(160),
  major: z.string().trim().min(3, { message: 'Nama jurusan wajib diisi' }).max(160),
  semester: z.string().trim().regex(/^(?:[1-9]|1[0-4])$/, 'Semester harus antara 1 dan 14'),
  entryYear: z.coerce.number().int().min(1990).max(2100),
  district: z.string().trim().min(2, 'Kecamatan wajib diisi').max(100),
  village: z.string().trim().min(2, 'Desa/Kelurahan wajib diisi').max(100),
  address: z.string().trim().min(10, { message: 'Alamat lengkap wajib diisi' }).max(1000),
  whatsapp: z.string().trim().regex(/^(?:\+62|62|0)8\d{8,11}$/, 'Nomor WhatsApp Indonesia tidak valid'),
  reasons: z.string().trim().min(20, { message: 'Alasan bergabung minimal 20 karakter' }).max(2000),
  organizationExperience: z.string().trim().max(2000).optional(),
  interests: z.string().trim().max(1000).optional(),
  bot_field: z.string().optional(), // Honeypot
  consent: z.boolean().refine(val => val === true, { message: 'Anda harus menyetujui syarat dan ketentuan' })
})

export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>
