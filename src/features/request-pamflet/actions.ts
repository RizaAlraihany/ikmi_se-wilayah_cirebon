'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { ValidationError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'
import { RateLimitError } from '@/core/security/rate-limiter'
import { notifyAdminKomdigiPamfletRequest } from '@/features/notification/whatsapp'
import { requestPamfletSchema } from './schemas'
import { pamfletRequestService } from './services'
import {
  assertPamfletRequestRateLimit,
  pamfletRequestClientIp,
} from './security'

export type SubmitPamfletRequestResult =
  | { success: true; requestNumber: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function submitRequestPamfletAction(formData: FormData): Promise<SubmitPamfletRequestResult> {
  const headerList = await headers()
  const ip = pamfletRequestClientIp(
    headerList.get('x-forwarded-for'),
    headerList.get('x-real-ip'),
  )

  try {
    await assertPamfletRequestRateLimit(ip)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.' }
    }
    logger.error(error, { workflow: 'pamflet_request_rate_limit' })
    return { success: false, error: 'Request belum dapat dikirim. Silakan coba lagi.' }
  }

  const honeypot = formData.get('bot_field')
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return { success: false, error: 'Request tidak dapat diproses.' }
  }

  const parsed = requestPamfletSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return {
      success: false,
      error: 'Periksa kembali kolom yang belum sesuai.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const attachmentEntry = formData.get('attachment')
  const attachment = attachmentEntry instanceof File && attachmentEntry.size > 0
    ? attachmentEntry
    : undefined

  try {
    const created = await pamfletRequestService.createPublicRequest(parsed.data, attachment)
    after(async () => {
      try {
        const deliveries = await notifyAdminKomdigiPamfletRequest(created)
        logger.workflow('pamflet_request_notification_finished', {
          requestId: created.id,
          deliveryCount: deliveries.length,
          failedCount: deliveries.filter((delivery) => !delivery.success).length,
        })
      } catch (error) {
        // Notification is deliberately outside the request transaction. A
        // provider/configuration failure must never reverse a saved request.
        logger.error(error, {
          workflow: 'pamflet_request_notification',
          requestId: created.id,
        })
      }
    })
    return { success: true, requestNumber: created.requestNumber }
  } catch (error) {
    if (error instanceof ValidationError) return { success: false, error: error.message }
    logger.error(error, { workflow: 'pamflet_request_create' })
    return { success: false, error: 'Terjadi kendala saat menyimpan request. Silakan coba lagi.' }
  }
}
