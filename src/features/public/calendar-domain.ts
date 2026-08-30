const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const MIN_CALENDAR_YEAR = 2000
const MAX_CALENDAR_YEAR = 2100

export type CalendarEventStatus = 'NORMAL' | 'POSTPONED' | 'CANCELLED'

export type CalendarEvent = {
  id: string
  type: 'program' | 'agenda'
  name: string
  date: Date
  endDate: Date | null
  location: string | null
  unitName: string | null
  status: CalendarEventStatus
  scheduleType?: string
  slug?: string | null
}

export function jakartaDateParts(value: Date) {
  const local = new Date(value.getTime() + JAKARTA_OFFSET_MS)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
  }
}

export function jakartaCalendarDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day) - JAKARTA_OFFSET_MS)
}

export function calendarDateKey(value: Date) {
  const { year, month, day } = jakartaDateParts(value)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeCalendarMonth(yearValue: string | undefined, monthValue: string | undefined, now = new Date()) {
  const current = jakartaDateParts(now)
  const requestedYear = yearValue === undefined ? current.year : Number(yearValue)
  const requestedMonth = monthValue === undefined ? current.month : Number(monthValue)
  return {
    year: Number.isInteger(requestedYear) && requestedYear >= MIN_CALENDAR_YEAR && requestedYear <= MAX_CALENDAR_YEAR
      ? requestedYear
      : current.year,
    month: Number.isInteger(requestedMonth) && requestedMonth >= 0 && requestedMonth <= 11
      ? requestedMonth
      : current.month,
  }
}

export function normalizeSelectedCalendarDate(
  value: string | undefined,
  year: number,
  month: number,
  today: string,
) {
  const defaultDate = today.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)
    ? today
    : `${year}-${String(month + 1).padStart(2, '0')}-01`
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return defaultDate
  const [dateYear, dateMonth, dateDay] = value.split('-').map(Number)
  const candidate = jakartaCalendarDate(dateYear, dateMonth - 1, dateDay)
  const parts = jakartaDateParts(candidate)
  if (parts.year !== dateYear || parts.month !== dateMonth - 1 || parts.day !== dateDay) return defaultDate
  return dateYear === year && dateMonth - 1 === month ? value : defaultDate
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const key = calendarDateKey(event.date)
    const existing = map.get(key)
    if (existing) existing.push(event)
    else map.set(key, [event])
  }
  return map
}

export function buildCalendarGrid(year: number, month: number): Date[] {
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const startOffset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const days: Date[] = []
  for (let index = 0; index < startOffset; index += 1) {
    days.push(jakartaCalendarDate(year, month, 1 - startOffset + index))
  }
  for (let day = 1; day <= dayCount; day += 1) {
    days.push(jakartaCalendarDate(year, month, day))
  }
  while (days.length % 7 !== 0) {
    days.push(jakartaCalendarDate(year, month, dayCount + (days.length - startOffset - dayCount) + 1))
  }
  return days
}

export function calendarMonthRange(year: number, month: number): [Date, Date] {
  const start = jakartaCalendarDate(year, month, 1)
  const end = new Date(jakartaCalendarDate(year, month + 1, 1).getTime() - 1)
  return [start, end]
}

export function shiftCalendarMonth(year: number, month: number, offset: -1 | 1) {
  const absoluteMonth = year * 12 + month + offset
  const nextYear = Math.floor(absoluteMonth / 12)
  return { year: nextYear, month: absoluteMonth - nextYear * 12 }
}

export function calendarMonthUrl(
  year: number,
  month: number,
  offset: -1 | 1,
  type: 'all' | 'program' | 'agenda',
) {
  const next = shiftCalendarMonth(year, month, offset)
  const date = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
  return `/kalender?year=${next.year}&month=${next.month}&date=${date}${type === 'all' ? '' : `&type=${type}`}`
}
