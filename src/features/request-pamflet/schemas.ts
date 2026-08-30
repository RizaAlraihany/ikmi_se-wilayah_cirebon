import { z } from 'zod'

export const PAMFLET_REQUEST_TYPES = [
  'Poster',
  'Instagram Feed',
  'Instagram Story',
  'Carousel',
  'Banner',
  'Lainnya',
] as const

const optionalText = (maximum: number, message: string) => z.string().trim().max(maximum, message).optional()

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, yearValue, monthValue, dayValue] = match
  const [year, month, day] = [yearValue, monthValue, dayValue].map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

const dateOnlySchema = (requiredMessage: string) => z.string()
  .min(1, requiredMessage)
  .refine(isValidDateOnly, 'Tanggal tidak valid')

export const requestPamfletSchema = z.object({
  requesterName: z.string().trim().min(2, 'Nama pengaju minimal 2 karakter').max(120, 'Nama pengaju terlalu panjang'),
  requesterUnit: z.string().trim().min(2, 'Unit atau departemen wajib diisi').max(120, 'Nama unit terlalu panjang'),
  requesterWhatsapp: z.string()
    .trim()
    .min(9, 'Nomor WhatsApp tidak valid')
    .max(24, 'Nomor WhatsApp terlalu panjang')
    .transform(normalizeWhatsapp)
    .refine((value) => /^62\d{8,13}$/.test(value), 'Gunakan nomor WhatsApp Indonesia yang valid'),

  relatedEntity: z.string().trim().max(180, 'Relasi kegiatan tidak valid').optional(),

  activityName: z.string().trim().min(3, 'Nama kegiatan minimal 3 karakter').max(180, 'Nama kegiatan terlalu panjang'),
  theme: optionalText(180, 'Tema terlalu panjang'),
  eventDate: dateOnlySchema('Tanggal kegiatan wajib diisi'),
  eventStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Jam mulai tidak valid').optional().or(z.literal('')),
  eventEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Jam selesai tidak valid').optional().or(z.literal('')),
  location: optionalText(240, 'Lokasi atau link terlalu panjang'),

  requestType: z.enum(PAMFLET_REQUEST_TYPES, { message: 'Pilih jenis kebutuhan' }),
  description: z.string().trim().min(10, 'Informasi pamflet minimal 10 karakter').max(5000, 'Informasi pamflet maksimal 5.000 karakter'),
  contactPerson: optionalText(180, 'Contact Person terlalu panjang'),
  caption: optionalText(3000, 'Saran caption maksimal 3.000 karakter'),
  deadline: dateOnlySchema('Deadline pengerjaan wajib diisi'),

  referenceLink: z.string().trim().max(2048, 'Link referensi terlalu panjang').optional().or(z.literal('')).refine((value) => {
    if (!value) return true
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Link referensi harus menggunakan HTTPS'),

  requesterNotes: optionalText(3000, 'Catatan tambahan maksimal 3.000 karakter'),

  bot_field: z.string().max(0, 'Invalid request').optional(),
}).superRefine((data, context) => {
  if (data.relatedEntity && !/^(program|agenda):[^:]{1,150}$/.test(data.relatedEntity)) {
    context.addIssue({ code: 'custom', path: ['relatedEntity'], message: 'Program atau Agenda tidak valid' })
  }
  if (data.eventEndTime && !data.eventStartTime) {
    context.addIssue({ code: 'custom', path: ['eventStartTime'], message: 'Isi jam mulai terlebih dahulu' })
  }
  if (data.eventStartTime && data.eventEndTime && data.eventEndTime <= data.eventStartTime) {
    context.addIssue({ code: 'custom', path: ['eventEndTime'], message: 'Jam selesai harus setelah jam mulai' })
  }
})

export type RequestPamfletFormInput = z.input<typeof requestPamfletSchema>
export type RequestPamfletData = z.output<typeof requestPamfletSchema>
