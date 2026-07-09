import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong' }),
})

export type LoginInput = z.infer<typeof loginSchema>
