import { z } from 'zod'
import { parseJakartaDatetime, parseSupportedRRule } from './domain'

const id = z.string().trim().min(1).max(191)
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((value) => value || null)
const optionalDate = optionalText(40).transform((value, ctx) => {
  if (!value) return null
  try {
    return parseJakartaDatetime(value)
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tanggal tidak valid.' })
    return z.NEVER
  }
})
const integerOrNull = z.union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => value === null || value === undefined || value === '' ? null : Number(value))
  .refine((value) => value === null || Number.isInteger(value), 'Offset harus berupa bilangan bulat')
  .refine((value) => value === null || (value >= -3_650 && value <= 3_650), 'Offset maksimal 3.650 hari')

export const agendaSchema = z.object({
  name: z.string().trim().min(3, 'Nama agenda minimal 3 karakter').max(160, 'Nama agenda maksimal 160 karakter'),
  organizationalUnitId: id,
  periodId: id,
  description: optionalText(10_000),
  picId: optionalText(191),
  programId: optionalText(191),
  scheduleType: z.enum(['FIXED_DATE', 'RECURRING', 'CONDITIONAL', 'RELATIVE_TO_PROGRAM', 'DEPENDENT_ON_PROGRAM']),
  startDatetime: optionalDate,
  endDatetime: optionalDate,
  recurrenceRule: optionalText(200),
  relativeToProgramId: optionalText(191),
  relativeOffset: integerOrNull,
  conditionalNote: optionalText(5_000),
  location: optionalText(200),
  visibility: z.enum(['PUBLIC', 'MEMBER_ONLY', 'PENGURUS_ONLY', 'BPH_ONLY', 'HIDDEN']),
  // DRAFT controls publication; SCHEDULED means active. Normal time status is derived.
  status: z.enum(['DRAFT', 'SCHEDULED', 'POSTPONED', 'CANCELLED']),
  requiresRegistration: z.boolean(),
  registrationType: z.enum(['GENERAL_REGISTRATION', 'MEMBERSHIP_RECRUITMENT', 'INTERNAL_REGISTRATION', 'EXTERNAL_LINK']).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.startDatetime && value.endDatetime && value.startDatetime > value.endDatetime) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDatetime'], message: 'Waktu selesai harus setelah waktu mulai.' })
  }
  if (value.scheduleType === 'FIXED_DATE' && !value.startDatetime) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDatetime'], message: 'Agenda bertanggal tetap wajib memiliki waktu mulai.' })
  }
  if (value.scheduleType === 'RECURRING') {
    if (!value.recurrenceRule) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recurrenceRule'], message: 'Agenda berulang wajib memiliki RRULE.' })
    } else {
      try {
        parseSupportedRRule(value.recurrenceRule)
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recurrenceRule'],
          message: error instanceof Error ? error.message : 'RRULE tidak valid.',
        })
      }
    }
  }
  if (value.scheduleType === 'RELATIVE_TO_PROGRAM' && (!value.relativeToProgramId || value.relativeOffset === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['relativeToProgramId'], message: 'Agenda relatif wajib memilih Program dan offset hari.' })
  }
  if (value.scheduleType === 'DEPENDENT_ON_PROGRAM' && !value.relativeToProgramId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['relativeToProgramId'], message: 'Agenda dependen wajib memilih Program.' })
  }
  if (value.scheduleType === 'CONDITIONAL' && !value.conditionalNote) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['conditionalNote'], message: 'Agenda kondisional wajib memiliki catatan kondisi.' })
  }
  if (value.requiresRegistration && !value.registrationType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registrationType'], message: 'Jenis pendaftaran wajib dipilih.' })
  }
  if (!value.requiresRegistration && value.registrationType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registrationType'], message: 'Jenis pendaftaran hanya diisi bila pendaftaran aktif.' })
  }
})

export type AgendaInput = z.infer<typeof agendaSchema>
