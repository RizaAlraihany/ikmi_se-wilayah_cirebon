import { z } from 'zod'

const blankToNull = z.string().trim().optional().nullable().transform((value) => value || null)
const optionalDate = blankToNull
  .transform((value) => (value ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), 'Tanggal tidak valid')

export const periodSchema = z.object({
  name: z.string().trim().min(3, 'Nama periode minimal 3 karakter'),
  cabinetName: blankToNull,
  chairmanName: blankToNull,
  startDate: optionalDate,
  endDate: optionalDate,
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
}).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
  message: 'Tanggal akhir periode harus setelah tanggal mulai.',
  path: ['endDate'],
})

export const organizationalUnitSchema = z.object({
  name: z.string().trim().min(2, 'Nama unit minimal 2 karakter'),
  code: z.string().trim().min(2, 'Kode unit minimal 2 karakter').max(32).transform((value) => value.toUpperCase()),
  description: blankToNull,
  email: blankToNull.refine((value) => value === null || z.string().email().safeParse(value).success, 'Email unit tidak valid'),
  headMemberId: blankToNull,
  periodId: blankToNull,
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  unitType: z.enum(['BPH', 'SECRETARIAT', 'TREASURY', 'DEPARTMENT', 'DIVISION']),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
})

export const organizationalPositionSchema = z.object({
  name: z.string().trim().min(2, 'Nama jabatan minimal 2 karakter'),
  departmentId: blankToNull,
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
})

export type PeriodInput = z.input<typeof periodSchema>
export type OrganizationalUnitInput = z.input<typeof organizationalUnitSchema>
export type OrganizationalPositionInput = z.input<typeof organizationalPositionSchema>
