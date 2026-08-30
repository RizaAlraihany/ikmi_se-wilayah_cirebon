import { BroadcastStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import type { WAResult } from '@/core/notifications/wa-service'

export const CONTENT_PLAN_BROADCAST_CHANNEL = 'WHATSAPP_CONTENT_PLAN'

type BroadcastClaim =
  | { kind: 'claimed'; deliveryId: string }
  | { kind: 'already_sent' }
  | { kind: 'in_progress' }

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export function createContentPlanBroadcastKey(period: string, recipient: string) {
  return `content-plan:${period}:${recipient}`
}

export async function claimBroadcast(
  broadcastKey: string,
  recipient: string,
): Promise<BroadcastClaim> {
  const existing = await prisma.broadcastDelivery.findUnique({ where: { broadcastKey } })

  if (!existing) {
    try {
      const delivery = await prisma.broadcastDelivery.create({
        data: {
          broadcastKey,
          channel: CONTENT_PLAN_BROADCAST_CHANNEL,
          recipient,
          status: BroadcastStatus.SENDING,
          attemptCount: 1,
        },
      })
      return { kind: 'claimed', deliveryId: delivery.id }
    } catch (error) {
      if (isUniqueConstraintError(error)) return { kind: 'in_progress' }
      throw error
    }
  }

  if (existing.status === BroadcastStatus.SENT) return { kind: 'already_sent' }

  // A send without a recorded provider result is ambiguous: the provider may
  // already have accepted it, so reconciliation is safer than an automatic retry.
  if (existing.status === BroadcastStatus.SENDING) return { kind: 'in_progress' }

  const result = await prisma.broadcastDelivery.updateMany({
    where: {
      id: existing.id,
      status: existing.status,
    },
    data: {
      status: BroadcastStatus.SENDING,
      attemptCount: { increment: 1 },
      lastError: null,
    },
  })

  return result.count === 1
    ? { kind: 'claimed', deliveryId: existing.id }
    : { kind: 'in_progress' }
}

export async function recordBroadcastResult(deliveryId: string, result: WAResult, now = new Date()) {
  if (result.success) {
    await prisma.broadcastDelivery.update({
      where: { id: deliveryId },
      data: {
        status: BroadcastStatus.SENT,
        sentAt: now,
        providerMessageId: result.messageId || null,
        lastError: null,
      },
    })
    return
  }

  await prisma.broadcastDelivery.update({
    where: { id: deliveryId },
    data: {
      status: BroadcastStatus.FAILED,
      lastError: result.error || 'Provider tidak mengembalikan detail error.',
    },
  })
}
