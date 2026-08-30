import { z } from 'zod'

export const assignStructureSchema = z.object({
  personType: z.enum(['MEMBER', 'USER']),
  personId: z.string().min(1, 'Pengurus harus dipilih').max(80),
  departmentId: z.string().min(1, 'Departemen/Unit harus dipilih'),
  positionId: z.string().min(1, 'Jabatan harus dipilih'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
})

export type AssignStructureInput = z.infer<typeof assignStructureSchema>
