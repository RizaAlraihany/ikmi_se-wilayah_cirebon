import type { ContentPlanStatus } from '@prisma/client'
import { jakartaCalendarDate, jakartaDateParts } from '@/features/public/calendar-domain'

export const CONTENT_PLATFORMS = ['Instagram', 'Website', 'TikTok', 'YouTube', 'Lainnya'] as const
export const CONTENT_TYPES = ['Poster', 'Carousel', 'Reels', 'Story', 'Artikel', 'Dokumentasi', 'Video', 'Announcement', 'Lainnya'] as const
export const CONTENT_PLAN_STATUSES = ['IDE', 'PLANNED', 'IN_PROGRESS', 'READY', 'SCHEDULED', 'PUBLISHED', 'CANCELLED'] as const

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

export function normalizeContentPlanMonth(value: string | undefined, now = new Date()) {
  const current = jakartaDateParts(now)
  if (!value || !/^(\d{4})-(\d{2})$/.test(value)) {
    return `${current.year}-${String(current.month + 1).padStart(2, '0')}`
  }
  const [year, month] = value.split('-').map(Number)
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return `${current.year}-${String(current.month + 1).padStart(2, '0')}`
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

export function contentPlanMonthRange(monthValue: string) {
  const normalized = normalizeContentPlanMonth(monthValue)
  const [year, month] = normalized.split('-').map(Number)
  return {
    month: normalized,
    year,
    monthIndex: month - 1,
    start: jakartaCalendarDate(year, month - 1, 1),
    end: jakartaCalendarDate(year, month, 1),
  }
}

export function shiftContentPlanMonth(monthValue: string, offset: -1 | 1) {
  const { year, monthIndex } = contentPlanMonthRange(monthValue)
  const absolute = year * 12 + monthIndex + offset
  const nextYear = Math.floor(absolute / 12)
  const nextMonth = absolute - nextYear * 12 + 1
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

export function parseJakartaContentDatetime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return new Date(Number.NaN)
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match
  const [year, month, day, hour, minute] = [yearValue, monthValue, dayValue, hourValue, minuteValue].map(Number)
  const result = new Date(Date.UTC(year, month - 1, day, hour, minute) - JAKARTA_OFFSET_MS)
  const check = new Date(result.getTime() + JAKARTA_OFFSET_MS)
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
    || check.getUTCHours() !== hour
    || check.getUTCMinutes() !== minute
  ) return new Date(Number.NaN)
  return result
}

export function formatJakartaContentDatetime(value: Date | null | undefined) {
  if (!value) return ''
  const local = new Date(value.getTime() + JAKARTA_OFFSET_MS)
  const part = (number: number) => String(number).padStart(2, '0')
  return `${local.getUTCFullYear()}-${part(local.getUTCMonth() + 1)}-${part(local.getUTCDate())}T${part(local.getUTCHours())}:${part(local.getUTCMinutes())}`
}

export function contentPlanDateKey(value: Date) {
  const parts = jakartaDateParts(value)
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function isContentPlanOverdue(plan: { publishDate: Date; status: ContentPlanStatus | string }, now = new Date()) {
  return plan.publishDate < now && plan.status !== 'PUBLISHED' && plan.status !== 'CANCELLED'
}

export function contentPlanStatusLabel(status: ContentPlanStatus | string) {
  const labels: Record<string, string> = {
    IDE: 'Ide',
    PLANNED: 'Direncanakan',
    IN_PROGRESS: 'Dikerjakan',
    READY: 'Siap',
    SCHEDULED: 'Terjadwal',
    PUBLISHED: 'Dipublikasikan',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] ?? status
}

export function isSafeContentUrl(value: string | null | undefined) {
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
