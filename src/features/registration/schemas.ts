import { z } from 'zod'

export const registrationCreateSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  campus: z.string().min(3, { message: 'Nama kampus wajib diisi' }),
  major: z.string().min(3, { message: 'Nama jurusan wajib diisi' }),
  semester: z.string().min(1, { message: 'Semester wajib diisi' }),
  address: z.string().min(10, { message: 'Alamat lengkap wajib diisi' }),
  whatsapp: z.string().min(10, { message: 'Nomor WhatsApp wajib diisi dan minimal 10 digit' }),
  reasons: z.string().min(20, { message: 'Alasan bergabung minimal 20 karakter' }),
  bot_field: z.string().optional() // Honeypot
})

export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>
