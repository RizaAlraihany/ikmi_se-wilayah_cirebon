import { jakartaCalendarDate, jakartaDateParts } from '@/features/public/calendar-domain'
import { ValidationError } from '@/core/errors/custom-errors'

export const PAMFLET_REQUEST_NUMBER_PREFIX = 'REQ-PAMFLET'

export const PAMFLET_STATUS_LABELS = {
  BARU: 'Baru',
  DITERIMA: 'Diterima',
  DIKERJAKAN: 'Dikerjakan',
  PERLU_REVISI: 'Perlu Revisi',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
  DIBATALKAN: 'Dibatalkan',
} as const

export type PamfletWorkflowStatus = keyof typeof PAMFLET_STATUS_LABELS

export const PAMFLET_STATUS_TRANSITIONS: Record<PamfletWorkflowStatus, readonly PamfletWorkflowStatus[]> = {
  BARU: ['DITERIMA', 'DITOLAK', 'DIBATALKAN'],
  DITERIMA: ['DIKERJAKAN', 'PERLU_REVISI', 'DITOLAK', 'DIBATALKAN'],
  DIKERJAKAN: ['PERLU_REVISI', 'SELESAI', 'DIBATALKAN'],
  PERLU_REVISI: ['DIKERJAKAN', 'SELESAI', 'DIBATALKAN'],
  SELESAI: [],
  DITOLAK: [],
  DIBATALKAN: [],
}

export const PAMFLET_STATUSES_REQUIRING_NOTES: readonly PamfletWorkflowStatus[] = [
  'PERLU_REVISI',
  'DITOLAK',
  'DIBATALKAN',
]

export function allowedPamfletStatusTransitions(status: PamfletWorkflowStatus) {
  return PAMFLET_STATUS_TRANSITIONS[status]
}

export function assertPamfletStatusTransition(
  currentStatus: PamfletWorkflowStatus,
  nextStatus: PamfletWorkflowStatus,
) {
  if (!PAMFLET_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationError(
      `Status tidak dapat diubah dari ${PAMFLET_STATUS_LABELS[currentStatus]} ke ${PAMFLET_STATUS_LABELS[nextStatus]}.`,
    )
  }
}

export function validatePamfletStatusNotes(status: PamfletWorkflowStatus, notes?: string) {
  const normalized = notes?.trim()
  if (PAMFLET_STATUSES_REQUIRING_NOTES.includes(status) && (!normalized || normalized.length < 5)) {
    throw new ValidationError(`Catatan wajib diisi minimal 5 karakter untuk status ${PAMFLET_STATUS_LABELS[status]}.`)
  }
  if (normalized && normalized.length > 3000) {
    throw new ValidationError('Catatan internal maksimal 3.000 karakter.')
  }
  return normalized || undefined
}

export function parseJakartaDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(Number.NaN)
  const [, yearValue, monthValue, dayValue] = match
  const [year, month, day] = [yearValue, monthValue, dayValue].map(Number)
  const date = jakartaCalendarDate(year, month - 1, day)
  const check = jakartaDateParts(date)
  return check.year === year && check.month === month - 1 && check.day === day ? date : new Date(Number.NaN)
}

export function requestNumberPrefix(now = new Date()) {
  return `${PAMFLET_REQUEST_NUMBER_PREFIX}-${jakartaDateParts(now).year}-`
}

export function nextRequestNumber(prefix: string, latestRequestNumber?: string | null) {
  const previous = latestRequestNumber?.startsWith(prefix)
    ? Number.parseInt(latestRequestNumber.slice(prefix.length), 10)
    : 0
  const sequence = Number.isFinite(previous) ? previous + 1 : 1
  if (sequence > 9999) throw new ValidationError('Nomor Request Pamflet untuk tahun ini sudah mencapai batas.')
  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

export function formatEventTime(start?: string, end?: string) {
  if (!start) return null
  return end ? `${start}–${end} WIB` : `${start} WIB`
}

export function parseRelatedEntity(value?: string) {
  if (!value) return { programId: null, agendaId: null }
  const separator = value.indexOf(':')
  const kind = value.slice(0, separator)
  const id = value.slice(separator + 1)
  if (!id || (kind !== 'program' && kind !== 'agenda')) {
    throw new ValidationError('Program atau Agenda yang dipilih tidak valid.')
  }
  return kind === 'program'
    ? { programId: id, agendaId: null }
    : { programId: null, agendaId: id }
}
