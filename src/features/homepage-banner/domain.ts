import type { HomepageBannerStatus } from '@prisma/client'
import { ValidationError } from '@/core/errors/custom-errors'

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

export const CAMPAIGN_PHASES = ['BEFORE', 'PRA', 'AFTER', 'GENERAL'] as const
export const EDITABLE_CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'PAUSED'] as const
export const CAMPAIGN_STATES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED'] as const

export type CampaignState = (typeof CAMPAIGN_STATES)[number]

type CampaignLifecycleInput = {
  status: HomepageBannerStatus | string
  startAt: Date | null
  endAt: Date | null
}

export function deriveCampaignState(banner: CampaignLifecycleInput, now = new Date()): CampaignState {
  if (banner.status === 'ARCHIVED') return 'ARCHIVED'
  if (banner.status === 'DRAFT') return 'DRAFT'
  if (banner.status === 'PAUSED') return 'PAUSED'
  if (banner.endAt && banner.endAt < now) return 'EXPIRED'
  if (banner.startAt && banner.startAt > now) return 'SCHEDULED'
  if (banner.status === 'SCHEDULED' && !banner.startAt) return 'SCHEDULED'
  return 'ACTIVE'
}

export function campaignStateLabel(state: CampaignState) {
  const labels: Record<CampaignState, string> = {
    DRAFT: 'Draft',
    SCHEDULED: 'Terjadwal',
    ACTIVE: 'Aktif',
    PAUSED: 'Dijeda',
    EXPIRED: 'Berakhir',
    ARCHIVED: 'Diarsipkan',
  }
  return labels[state]
}

export function campaignPhaseLabel(phase: string) {
  const labels: Record<string, string> = {
    BEFORE: 'Sebelum kegiatan',
    PRA: 'Pra-kegiatan',
    AFTER: 'Setelah kegiatan',
    GENERAL: 'Umum',
  }
  return labels[phase] ?? phase
}

export function parseJakartaCampaignDatetime(value: FormDataEntryValue | null) {
  if (!value) return null
  if (typeof value !== 'string') throw new ValidationError('Format waktu campaign tidak valid.')
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new ValidationError('Format waktu campaign tidak valid.')

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
  ) throw new ValidationError('Waktu campaign tidak valid.')

  return result
}

export function formatJakartaCampaignDatetime(value: Date | null | undefined) {
  if (!value) return ''
  const local = new Date(value.getTime() + JAKARTA_OFFSET_MS)
  const part = (number: number) => String(number).padStart(2, '0')
  return `${local.getUTCFullYear()}-${part(local.getUTCMonth() + 1)}-${part(local.getUTCDate())}T${part(local.getUTCHours())}:${part(local.getUTCMinutes())}`
}

export function isSafeCampaignImageUrl(value: string | null | undefined) {
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

export function isSafeCampaignCtaUrl(value: string | null | undefined) {
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
