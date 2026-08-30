import { z } from 'zod'

export const registrationCreateSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  email: z.string().email('Format email tidak valid'),
  campus: z.string().min(3, { message: 'Nama kampus wajib diisi' }),
  major: z.string().min(3, { message: 'Nama jurusan wajib diisi' }),
  semester: z.string().min(1, { message: 'Semester wajib diisi' }),
  entryYear: z.coerce.number().int().min(1990).max(2100),
  district: z.string().trim().min(2, 'Kecamatan wajib diisi').max(100),
  village: z.string().trim().min(2, 'Desa/Kelurahan wajib diisi').max(100),
  address: z.string().min(10, { message: 'Alamat lengkap wajib diisi' }),
  whatsapp: z.string().min(10, { message: 'Nomor WhatsApp wajib diisi dan minimal 10 digit' }),
  reasons: z.string().min(20, { message: 'Alasan bergabung minimal 20 karakter' }),
  organizationExperience: z.string().trim().max(2000).optional(),
  interests: z.string().trim().max(1000).optional(),
  bot_field: z.string().optional(), // Honeypot
  consent: z.boolean().refine(val => val === true, { message: 'Anda harus menyetujui syarat dan ketentuan' })
})

export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>
