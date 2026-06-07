import { z } from 'zod'

export const submitComplaintSchema = z.object({
  senderName: z.string().min(3, 'Nama pengirim minimal 3 karakter'),
  campus: z.string().min(2, 'Nama kampus wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  message: z.string().min(10, 'Pesan aduan minimal 10 karakter'),
  bot_field: z.string().optional() // Honeypot
})

export type SubmitComplaintInput = z.infer<typeof submitComplaintSchema>

export const processComplaintSchema = z.object({
  status: z.enum(['PROCESSED', 'RESOLVED', 'REJECTED']),
  assignedTo: z.string().optional()
})

export type ProcessComplaintInput = z.infer<typeof processComplaintSchema>
