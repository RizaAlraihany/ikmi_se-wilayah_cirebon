import { z } from 'zod'

const blankToNull = z.string().trim().optional().nullable().transform((value) => value || null)

function jakartaDate(endOfDay: boolean) {
  return blankToNull
    .transform((value) => (value ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+07:00`) : null))
    .refine((value) => value === null || !Number.isNaN(value.getTime()), 'Tanggal tidak valid')
}

const optionalPositiveNumber = z.union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null
    const numberValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numberValue) ? numberValue : Number.NaN
  })
  .refine((value) => value === null || value > 0, 'Anggaran harus bernilai positif atau dikosongkan bila belum diverifikasi')

const registrationType = z.enum(['GENERAL_REGISTRATION', 'MEMBERSHIP_RECRUITMENT', 'INTERNAL_REGISTRATION', 'EXTERNAL_LINK'])
const visibility = z.enum(['PUBLIC', 'INTERNAL', 'HIDDEN'])

const programFieldsSchema = z.object({
  name: z.string().trim().min(3, 'Nama program minimal 3 karakter'),
  organizationalUnitId: z.string().trim().min(1, 'Unit organisasi wajib dipilih'),
  periodId: z.string().trim().min(1, 'Periode wajib dipilih'),
  description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter'),
  fullName: blankToNull,
  objective: blankToNull,
  targetAudience: blankToNull,
  method: blankToNull,
  output: blankToNull,
  picId: blankToNull,
  plannedStart: jakartaDate(false),
  plannedEnd: jakartaDate(true),
  location: blankToNull,
  plannedBudget: optionalPositiveNumber,
  visibility,
  campaignEnabled: z.boolean().default(false),
  featured: z.boolean().default(false),
  requiresRegistration: z.boolean().default(false),
  registrationType: registrationType.optional().nullable(),
})

function validateScheduleAndRegistration<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, context) => {
    const data = value as {
      plannedStart?: Date | null
      plannedEnd?: Date | null
      requiresRegistration?: boolean
      registrationType?: string | null
    }

    if (data.plannedStart && data.plannedEnd && data.plannedStart > data.plannedEnd) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Tanggal rencana selesai harus setelah tanggal mulai.', path: ['plannedEnd'] })
    }
    if ((data.plannedStart === null) !== (data.plannedEnd === null) && data.plannedStart !== undefined && data.plannedEnd !== undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Tanggal mulai dan selesai harus diisi bersamaan.', path: ['plannedEnd'] })
    }
    if (data.requiresRegistration === false && data.registrationType) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Jenis pendaftaran hanya boleh diisi bila pendaftaran diaktifkan.', path: ['registrationType'] })
    }
  })
}

export const programCreateSchema = validateScheduleAndRegistration(programFieldsSchema)
export const programUpdateSchema = validateScheduleAndRegistration(programFieldsSchema.partial())

export const programStatusOverrideSchema = z.object({
  statusOverride: z.enum(['POSTPONED', 'CANCELLED']).nullable(),
})

export const programRelationshipSchema = z.object({
  targetProgramId: z.string().trim().min(1, 'Program terkait wajib dipilih'),
  relationshipType: z.enum(['RELATED_TO', 'PART_OF', 'SCHEDULED_WITH', 'DEPENDS_ON']),
  note: blankToNull,
})
