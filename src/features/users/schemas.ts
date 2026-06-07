import { z } from 'zod'

export const userCreateSchema = z.object({
  name: z.string().min(3, { message: 'Nama minimal 3 karakter' }),
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  roleId: z.string().min(1, { message: 'Role harus dipilih' }),
  departmentId: z.string().min(1, { message: 'Departemen harus dipilih' }),
})

export const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional()
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
