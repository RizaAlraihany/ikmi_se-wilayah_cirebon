import { addDays, isAfter, isBefore } from 'date-fns'
import type { AgendaScheduleType } from '@prisma/client'
import { ValidationError } from '@/core/errors/custom-errors'

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const MAX_EXPANDED_OCCURRENCES = 1_000
const MAX_MONTH_ITERATIONS = 2_400

export const AGENDA_DERIVED_STATUSES = [
  'BELUM_DIJADWALKAN',
  'AKAN_DATANG',
  'BERJALAN',
  'SELESAI',
  'DITUNDA',
  'DIBATALKAN',
  'DRAFT',
  'ARCHIVED',
] as const

export type AgendaDerivedStatus = (typeof AGENDA_DERIVED_STATUSES)[number]

type AgendaForStatus = {
  status: string
  scheduleType: string
  startDatetime: Date | null
  endDatetime: Date | null
}

/** Normal operational state is calculated; only explicit overrides win. */
export function deriveAgendaStatus(agenda: AgendaForStatus, now = new Date()): AgendaDerivedStatus {
  if (agenda.status === 'POSTPONED') return 'DITUNDA'
  if (agenda.status === 'CANCELLED') return 'DIBATALKAN'
  if (agenda.status === 'ARCHIVED') return 'ARCHIVED'
  if (agenda.status === 'DRAFT') return 'DRAFT'

  if (agenda.scheduleType === 'FIXED_DATE') {
    if (!agenda.startDatetime) return 'BELUM_DIJADWALKAN'
    if (now < agenda.startDatetime) return 'AKAN_DATANG'
    if (!agenda.endDatetime || now <= agenda.endDatetime) return 'BERJALAN'
    return 'SELESAI'
  }

  if (agenda.status === 'UNSCHEDULED') return 'BELUM_DIJADWALKAN'
  if (agenda.status === 'COMPLETED') return 'SELESAI'
  return agenda.status === 'SCHEDULED' ? 'AKAN_DATANG' : 'BELUM_DIJADWALKAN'
}

export function agendaStatusLabel(status: AgendaDerivedStatus): string {
  const labels: Record<AgendaDerivedStatus, string> = {
    BELUM_DIJADWALKAN: 'Belum dijadwalkan',
    AKAN_DATANG: 'Akan datang',
    BERJALAN: 'Berjalan',
    SELESAI: 'Selesai',
    DITUNDA: 'Ditunda',
    DIBATALKAN: 'Dibatalkan',
    DRAFT: 'Draft',
    ARCHIVED: 'Diarsipkan',
  }
  return labels[status]
}

export function agendaStatusTone(status: AgendaDerivedStatus): 'success' | 'accent' | 'warning' | 'danger' | 'surface' {
  switch (status) {
    case 'BERJALAN': return 'success'
    case 'AKAN_DATANG': return 'accent'
    case 'BELUM_DIJADWALKAN': return 'warning'
    case 'DIBATALKAN':
    case 'DITUNDA': return 'danger'
    default: return 'surface'
  }
}

export function agendaVisibilityLabel(visibility: string | null | undefined): string {
  const labels: Record<string, string> = {
    PUBLIC: 'Publik',
    MEMBER_ONLY: 'Khusus anggota',
    PENGURUS_ONLY: 'Khusus pengurus',
    BPH_ONLY: 'Khusus BPH',
    HIDDEN: 'Disembunyikan',
  }
  return visibility ? (labels[visibility] ?? visibility) : 'Belum ditentukan'
}

export function scheduleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FIXED_DATE: 'Tanggal tetap',
    RECURRING: 'Berulang',
    CONDITIONAL: 'Kondisional',
    RELATIVE_TO_PROGRAM: 'Relatif ke Program',
    DEPENDENT_ON_PROGRAM: 'Mengikuti Program',
  }
  return labels[type] ?? type
}

export function parseJakartaDatetime(value: string): Date {
  const localMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!localMatch) {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) throw new ValidationError('Tanggal tidak valid.')
    return parsed
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue = '0'] = localMatch
  const parts = [yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue].map(Number)
  const [year, month, day, hour, minute, second] = parts
  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - JAKARTA_OFFSET_MS)
  const check = new Date(parsed.getTime() + JAKARTA_OFFSET_MS)
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
    || check.getUTCHours() !== hour
    || check.getUTCMinutes() !== minute
    || check.getUTCSeconds() !== second
  ) {
    throw new ValidationError('Tanggal tidak valid.')
  }
  return parsed
}

export function formatJakartaDatetimeLocal(value: Date | null): string {
  if (!value) return ''
  const local = new Date(value.getTime() + JAKARTA_OFFSET_MS)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}

type ProgramTiming = { actualEnd: Date | null } | null

export type AgendaScheduleInput = {
  id: string
  name: string
  scheduleType: AgendaScheduleType
  startDatetime: Date | null
  endDatetime: Date | null
  recurrenceRule: string | null
  relativeOffset: number | null
  program: ProgramTiming
  relativeToProgram: ProgramTiming
}

export type AgendaOccurrence = {
  agendaId: string
  name: string
  start: Date
  end: Date | null
  scheduleType: AgendaScheduleType
}

type ParsedRRule = {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval: number
  byMonthDays: number[] | null
}

export function parseSupportedRRule(value: string): ParsedRRule {
  const entries: Record<string, string> = {}
  for (const rawPart of value.trim().toUpperCase().split(';')) {
    const match = /^([A-Z]+)=([^=]+)$/.exec(rawPart.trim())
    if (!match) throw new ValidationError('Format RRULE tidak valid.')
    const [, key, entry] = match
    if (!['FREQ', 'INTERVAL', 'BYMONTHDAY'].includes(key)) throw new ValidationError(`Bagian RRULE ${key} belum didukung.`)
    if (entries[key]) throw new ValidationError(`Bagian RRULE ${key} tidak boleh berulang.`)
    entries[key] = entry
  }

  const frequency = entries.FREQ as ParsedRRule['frequency']
  if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(frequency)) {
    throw new ValidationError('RRULE harus menggunakan FREQ=DAILY, WEEKLY, atau MONTHLY.')
  }

  const intervalText = entries.INTERVAL ?? '1'
  if (!/^\d+$/.test(intervalText)) throw new ValidationError('INTERVAL RRULE harus bilangan bulat positif.')
  const interval = Number(intervalText)
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
    throw new ValidationError('INTERVAL RRULE harus berada antara 1 dan 365.')
  }

  let byMonthDays: number[] | null = null
  if (entries.BYMONTHDAY) {
    if (frequency !== 'MONTHLY') throw new ValidationError('BYMONTHDAY hanya didukung untuk FREQ=MONTHLY.')
    const dayParts = entries.BYMONTHDAY.split(',')
    if (!dayParts.length || dayParts.some((day) => !/^\d{1,2}$/.test(day))) {
      throw new ValidationError('BYMONTHDAY RRULE tidak valid.')
    }
    const days = dayParts.map(Number)
    if (days.some((day) => day < 1 || day > 31)) throw new ValidationError('BYMONTHDAY harus berada antara 1 dan 31.')
    byMonthDays = [...new Set(days)].sort((left, right) => left - right)
  }

  return { frequency, interval, byMonthDays }
}

function occurrence(agenda: AgendaScheduleInput, start: Date, duration: number | null): AgendaOccurrence {
  return {
    agendaId: agenda.id,
    name: agenda.name,
    start,
    end: duration === null ? null : new Date(start.getTime() + duration),
    scheduleType: agenda.scheduleType,
  }
}

function isWithinRange(value: Date, rangeStart: Date, rangeEnd: Date) {
  return !isBefore(value, rangeStart) && !isAfter(value, rangeEnd)
}

function jakartaParts(value: Date) {
  const local = new Date(value.getTime() + JAKARTA_OFFSET_MS)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
    millisecond: local.getUTCMilliseconds(),
  }
}

function jakartaDate(year: number, month: number, day: number, time: ReturnType<typeof jakartaParts>) {
  const value = new Date(Date.UTC(year, month, day, time.hour, time.minute, time.second, time.millisecond) - JAKARTA_OFFSET_MS)
  const check = jakartaParts(value)
  return check.year === year && check.month === month && check.day === day ? value : null
}

function expandMonthlyOccurrences(
  agenda: AgendaScheduleInput,
  rule: ParsedRRule,
  rangeStart: Date,
  rangeEnd: Date,
  duration: number | null,
) {
  const start = agenda.startDatetime!
  const startParts = jakartaParts(start)
  const rangeParts = jakartaParts(rangeStart)
  const endParts = jakartaParts(rangeEnd)
  const baseMonth = startParts.year * 12 + startParts.month
  const firstRangeMonth = rangeParts.year * 12 + rangeParts.month
  const lastRangeMonth = endParts.year * 12 + endParts.month
  let step = Math.max(0, Math.floor((firstRangeMonth - baseMonth) / rule.interval) - 1)
  const occurrences: AgendaOccurrence[] = []
  let iterations = 0

  while (occurrences.length < MAX_EXPANDED_OCCURRENCES && iterations < MAX_MONTH_ITERATIONS) {
    const absoluteMonth = baseMonth + step * rule.interval
    if (absoluteMonth > lastRangeMonth + rule.interval) break
    const year = Math.floor(absoluteMonth / 12)
    const month = absoluteMonth - year * 12
    const days = rule.byMonthDays ?? [startParts.day]

    for (const day of days) {
      const candidate = jakartaDate(year, month, day, startParts)
      if (!candidate || isBefore(candidate, start)) continue
      if (isWithinRange(candidate, rangeStart, rangeEnd)) occurrences.push(occurrence(agenda, candidate, duration))
      if (occurrences.length >= MAX_EXPANDED_OCCURRENCES) break
    }
    step += 1
    iterations += 1
  }

  return occurrences.sort((left, right) => left.start.getTime() - right.start.getTime())
}

export function expandAgendaOccurrences(agenda: AgendaScheduleInput, rangeStart: Date, rangeEnd: Date): AgendaOccurrence[] {
  if (isAfter(rangeStart, rangeEnd) || agenda.scheduleType === 'CONDITIONAL') return []

  if (agenda.scheduleType === 'RELATIVE_TO_PROGRAM' || agenda.scheduleType === 'DEPENDENT_ON_PROGRAM') {
    const anchor = agenda.relativeToProgram?.actualEnd ?? agenda.program?.actualEnd ?? null
    if (!anchor) return []
    const start = addDays(anchor, agenda.relativeOffset ?? 0)
    return isWithinRange(start, rangeStart, rangeEnd) ? [occurrence(agenda, start, null)] : []
  }

  if (!agenda.startDatetime) return []
  const duration = agenda.endDatetime ? agenda.endDatetime.getTime() - agenda.startDatetime.getTime() : null
  if (agenda.scheduleType === 'FIXED_DATE') {
    return isWithinRange(agenda.startDatetime, rangeStart, rangeEnd)
      ? [occurrence(agenda, agenda.startDatetime, duration)]
      : []
  }

  if (!agenda.recurrenceRule) return []
  const rule = parseSupportedRRule(agenda.recurrenceRule)
  if (rule.frequency === 'MONTHLY') {
    return expandMonthlyOccurrences(agenda, rule, rangeStart, rangeEnd, duration)
  }

  const stepDays = rule.frequency === 'WEEKLY' ? rule.interval * 7 : rule.interval
  const stepMs = stepDays * 24 * 60 * 60 * 1000
  let cursor = agenda.startDatetime
  if (isBefore(cursor, rangeStart)) {
    const jumps = Math.max(0, Math.floor((rangeStart.getTime() - cursor.getTime()) / stepMs))
    cursor = addDays(cursor, jumps * stepDays)
    while (isBefore(cursor, rangeStart)) cursor = addDays(cursor, stepDays)
  }

  const occurrences: AgendaOccurrence[] = []
  while (!isAfter(cursor, rangeEnd) && occurrences.length < MAX_EXPANDED_OCCURRENCES) {
    occurrences.push(occurrence(agenda, cursor, duration))
    cursor = addDays(cursor, stepDays)
  }
  return occurrences
}
