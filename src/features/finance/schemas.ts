import { z } from 'zod'

export const financeRequestCreateSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Jumlah dana harus lebih besar dari 0' }),
  description: z.string().min(5, { message: 'Deskripsi minimal 5 karakter' }),
  proofUrl: z.string().url({ message: 'URL bukti tidak valid' }),
})

export type FinanceRequestCreateInput = z.infer<typeof financeRequestCreateSchema>
