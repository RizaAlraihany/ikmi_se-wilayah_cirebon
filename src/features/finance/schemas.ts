import { z } from 'zod'

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])

export const financeTransactionCreateSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive({ message: 'Jumlah harus lebih besar dari 0' }),
  description: z.string().min(3, { message: 'Deskripsi minimal 3 karakter' }),
  category: z.string().min(1, { message: 'Kategori wajib diisi' }),
  date: z.coerce.date(),
  proofUrl: z.string().url().optional().or(z.literal('')),
  proofPublicId: z.string().optional(),
})

export const financeTransactionUpdateSchema = financeTransactionCreateSchema.partial()

export type TransactionType = z.infer<typeof transactionTypeSchema>
export type FinanceTransactionCreateInput = z.infer<typeof financeTransactionCreateSchema>
export type FinanceTransactionUpdateInput = z.infer<typeof financeTransactionUpdateSchema>
