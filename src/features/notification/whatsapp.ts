import { Prisma, WhatsappMessageStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { logger } from '@/core/monitoring/logger'

const FONNTE_SEND_URL = 'https://api.fonnte.com/send'
const DELIVERY_CLAIM_TTL_MS = 5 * 60 * 1000
const CONFIGURATION_RECIPIENT = 'NOT_CONFIGURED'
const DEFAULT_DASHBOARD_URL = 'https://dashboard.ikmicirebon.web.id'

export type TrustedRecipient = {
  name: string
  number: string
  active: true
}

export type PamfletNotificationInfo = {
  id: string
  requestNumber: string
  activityName: string
  requesterName: string
  requesterUnit: string
  deadline: Date
}

export type WhatsappDeliveryResult =
  | { success: true; reason?: 'already_sent' | 'in_progress'; providerMessageId?: string }
  | { success: false; error: string }

type FonnteResponse = {
  status?: unknown
  id?: unknown
  requestid?: unknown
  reason?: unknown
}

function normalizeRecipient(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  const number = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits
  return /^[0-9]{9,15}$/.test(number) ? number : null
}

function uniqueRecipients(recipients: TrustedRecipient[]) {
  const unique = new Map<string, TrustedRecipient>()
  recipients.forEach((recipient) => {
    if (!unique.has(recipient.number)) unique.set(recipient.number, recipient)
  })
  return [...unique.values()]
}

/** Recipients live only in trusted server configuration, never in public form input. */
export function getActiveAdminKomdigiRecipients(): TrustedRecipient[] {
  const configured = process.env.ADMIN_KOMDIGI_WA_RECIPIENTS
  if (configured) {
    try {
      const parsed: unknown = JSON.parse(configured)
      if (Array.isArray(parsed)) {
        return uniqueRecipients(parsed.flatMap((entry, index): TrustedRecipient[] => {
          if (!entry || typeof entry !== 'object') return []
          const candidate = entry as { name?: unknown; number?: unknown; active?: unknown }
          if (candidate.active === false) return []
          const number = typeof candidate.number === 'string' ? normalizeRecipient(candidate.number) : null
          if (!number) return []
          const name = typeof candidate.name === 'string' && candidate.name.trim()
            ? candidate.name.trim().slice(0, 120)
            : `Admin Komdigi ${index + 1}`
          return [{ name, number, active: true }]
        }))
      }
    } catch (error) {
      logger.warn('Konfigurasi recipient WhatsApp tidak valid.', {
        workflow: 'pamflet_request_notification_config',
        errorType: error instanceof Error ? error.name : 'UnknownError',
      })
    }
  }

  return uniqueRecipients((process.env.ADMIN_KOMDIGI_WA_NUMBERS ?? '')
    .split(',')
    .flatMap((value, index): TrustedRecipient[] => {
      const number = normalizeRecipient(value.trim())
      return number ? [{ name: `Admin Komdigi ${index + 1}`, number, active: true }] : []
    }))
}

function dashboardRequestUrl(requestId: string) {
  const configured = process.env.AUTH_URL || DEFAULT_DASHBOARD_URL
  try {
    const url = new URL(configured)
    const isLocalDevelopment = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname)
    if (url.protocol !== 'https:' && !isLocalDevelopment) throw new Error('Dashboard URL must use HTTPS')
    url.pathname = `/admin/request-pamflet/${encodeURIComponent(requestId)}`
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return `${DEFAULT_DASHBOARD_URL}/admin/request-pamflet/${encodeURIComponent(requestId)}`
  }
}

export function buildPamfletNotificationMessage(reqInfo: PamfletNotificationInfo) {
  const formattedDeadline = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(reqInfo.deadline)

  return `*REQUEST PAMFLET BARU*\n\n` +
    `No: ${reqInfo.requestNumber}\n` +
    `Kegiatan: ${reqInfo.activityName}\n` +
    `Pengaju: ${reqInfo.requesterName} — ${reqInfo.requesterUnit}\n` +
    `Deadline: ${formattedDeadline}\n\n` +
    'Buka Dashboard:\n' +
    dashboardRequestUrl(reqInfo.id)
}

function providerMessageId(data: FonnteResponse) {
  const candidate = Array.isArray(data.id) ? data.id[0] : data.id ?? data.requestid
  return typeof candidate === 'string' || typeof candidate === 'number' ? String(candidate) : undefined
}

async function claimDelivery(
  recipient: string,
  message: string,
  idempotencyKey: string,
  now: Date,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`)
    const existing = await tx.whatsappMessageLog.findUnique({ where: { idempotencyKey } })
    if (existing?.status === WhatsappMessageStatus.SUCCESS) return 'already_sent' as const

    const staleBefore = new Date(now.getTime() - DELIVERY_CLAIM_TTL_MS)
    if (
      existing?.status === WhatsappMessageStatus.PENDING &&
      existing.lastAttemptAt &&
      existing.lastAttemptAt > staleBefore
    ) {
      return 'in_progress' as const
    }

    if (!existing) {
      await tx.whatsappMessageLog.create({
        data: {
          recipient,
          message,
          idempotencyKey,
          status: WhatsappMessageStatus.PENDING,
          attemptCount: 1,
          lastAttemptAt: now,
        },
      })
    } else {
      await tx.whatsappMessageLog.update({
        where: { idempotencyKey },
        data: {
          recipient,
          message,
          status: WhatsappMessageStatus.PENDING,
          attemptCount: { increment: 1 },
          errorMessage: null,
          failedAt: null,
          lastAttemptAt: now,
        },
      })
    }

    return 'claimed' as const
  })
}

export async function sendWhatsappMessage(
  recipient: string,
  message: string,
  idempotencyKey: string,
  now = new Date(),
): Promise<WhatsappDeliveryResult> {
  try {
    const claim = await claimDelivery(recipient, message, idempotencyKey, now)
    if (claim === 'already_sent') return { success: true, reason: 'already_sent' }
    if (claim === 'in_progress') return { success: true, reason: 'in_progress' }

    const token = process.env.FONNTE_TOKEN
    if (!token) throw new Error('FONNTE_TOKEN belum dikonfigurasi.')

    const response = await fetch(FONNTE_SEND_URL, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: recipient, message }),
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(15_000) : undefined,
    })
    const payload: unknown = await response.json()
    const data = payload && typeof payload === 'object' ? payload as FonnteResponse : {}
    const wasAccepted = response.ok && (data.status === true || data.status === 'true')
    if (!wasAccepted) {
      const reason = typeof data.reason === 'string' ? data.reason.slice(0, 500) : `HTTP ${response.status}`
      throw new Error(`Provider WhatsApp menolak pesan: ${reason}`)
    }

    const messageId = providerMessageId(data)
    await prisma.whatsappMessageLog.update({
      where: { idempotencyKey },
      data: {
        status: WhatsappMessageStatus.SUCCESS,
        providerMessageId: messageId ?? null,
        sentAt: now,
        failedAt: null,
        errorMessage: null,
      },
    })
    return { success: true, providerMessageId: messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Kegagalan provider tidak diketahui.'
    logger.error(error, {
      workflow: 'pamflet_request_whatsapp_delivery',
      idempotencyKey,
      recipientSuffix: recipient.slice(-4),
    })
    try {
      await prisma.whatsappMessageLog.update({
        where: { idempotencyKey },
        data: {
          status: WhatsappMessageStatus.FAILED,
          errorMessage: errorMessage.slice(0, 1000),
          failedAt: now,
        },
      })
    } catch (databaseError) {
      logger.error(databaseError, {
        workflow: 'pamflet_request_whatsapp_failure_persistence',
        idempotencyKey,
      })
    }
    return { success: false, error: errorMessage }
  }
}

async function recordMissingRecipient(reqInfo: PamfletNotificationInfo, message: string) {
  const now = new Date()
  const idempotencyKey = `req_pamflet_${reqInfo.requestNumber}_configuration`
  const error = 'Tidak ada recipient Admin Komdigi aktif yang dikonfigurasi.'

  try {
    await prisma.whatsappMessageLog.upsert({
      where: { idempotencyKey },
      create: {
        recipient: CONFIGURATION_RECIPIENT,
        message,
        idempotencyKey,
        status: WhatsappMessageStatus.FAILED,
        attemptCount: 1,
        errorMessage: error,
        failedAt: now,
        lastAttemptAt: now,
      },
      update: {
        message,
        status: WhatsappMessageStatus.FAILED,
        attemptCount: { increment: 1 },
        errorMessage: error,
        failedAt: now,
        lastAttemptAt: now,
      },
    })
  } catch (databaseError) {
    logger.error(databaseError, {
      workflow: 'pamflet_request_recipient_config_failure',
      requestId: reqInfo.id,
    })
  }

  return { success: false as const, error }
}

export async function notifyAdminKomdigiPamfletRequest(reqInfo: PamfletNotificationInfo) {
  const recipients = getActiveAdminKomdigiRecipients()
  const message = buildPamfletNotificationMessage(reqInfo)
  if (recipients.length === 0) return [await recordMissingRecipient(reqInfo, message)]

  return Promise.all(recipients.map(({ number }) =>
    sendWhatsappMessage(number, message, `req_pamflet_${reqInfo.requestNumber}_to_${number}`),
  ))
}
